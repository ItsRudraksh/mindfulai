import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { StorageId } from "convex/server";

export const createJournalEntry = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.any(), // TipTap JSON content
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("sepia"))
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    return await ctx.db.insert("journalEntries", {
      userId,
      title:
        args.title || `Journal Entry - ${new Date(now).toLocaleDateString()}`,
      content: args.content || { type: "doc", content: [] },
      theme: args.theme || "light",
      tags: args.tags || [],
      isPrivate: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateJournalEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("sepia"))
    ),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const { entryId, ...updates } = args;
    const entry = await ctx.db.get(entryId);

    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    // Update the journal entry
    const updatedEntry = await ctx.db.patch(entryId, {
      ...updates,
      updatedAt: Date.now(),
    });

    // If content was updated, process images
    if (updates.content) {
      // Schedule image processing
      await ctx.scheduler.runAfter(0, "journalEntries:processEntryImages", {
        entryId,
        userId,
      });
    }

    return updatedEntry;
  },
});

// Helper function to extract all image URLs from journal content
function extractImageUrls(content: any): string[] {
  const urls: string[] = [];

  // Recursive function to traverse the content tree
  function traverse(node: any) {
    if (node.type === 'image' && node.attrs?.src) {
      urls.push(node.attrs.src);
    }

    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  // Start traversal from the root
  if (content && content.content) {
    content.content.forEach(traverse);
  }

  return urls;
}

// Process images in a journal entry
export const processEntryImages = action({
  args: {
    entryId: v.id("journalEntries"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get the journal entry
    const entry = await ctx.runQuery("journalEntries:getJournalEntryById", {
      entryId: args.entryId,
    });

    if (!entry) {
      throw new Error("Journal entry not found");
    }

    // Extract all image URLs from the content
    const imageUrls = extractImageUrls(entry.content);
    
    // Get all images associated with this entry
    const existingImages = await ctx.runQuery("journalEntries:getEntryImages", {
      entryId: args.entryId,
    });

    // Mark all existing images as not in use initially
    for (const image of existingImages) {
      await ctx.runMutation("journalEntries:updateImageUsage", {
        imageId: image._id,
        isInUse: false,
      });
    }

    // Process each image URL found in the content
    for (const imageUrl of imageUrls) {
      // Skip non-base64 images that are already in Convex storage
      if (imageUrl.startsWith('https://') && imageUrl.includes('convex.cloud')) {
        // Find the image in our database
        const matchingImage = existingImages.find(img => {
          // Get the storage ID from the URL
          const urlParts = imageUrl.split('/');
          const storageId = urlParts[urlParts.length - 1];
          return img.storageId === storageId;
        });
        
        if (matchingImage) {
          // Mark as in use and update last used timestamp
          await ctx.runMutation("journalEntries:updateImageUsage", {
            imageId: matchingImage._id,
            isInUse: true,
            lastUsedAt: Date.now(),
          });
        }
        continue;
      }

      // Handle base64 images - these need to be uploaded to Convex storage
      if (imageUrl.startsWith('data:image')) {
        try {
          // Upload to Convex storage using the uploadImage action
          const result = await ctx.runAction("journalEntries:uploadImage", {
            base64Image: imageUrl,
            journalEntryId: args.entryId,
          });
          
          if (result.success && result.url) {
            // Update the image URL in the content
            await ctx.runMutation("journalEntries:replaceImageUrl", {
              entryId: args.entryId,
              oldUrl: imageUrl,
              newUrl: result.url,
            });
          }
        } catch (error) {
          console.error('Error processing base64 image:', error);
        }
      }
    }

    // Schedule cleanup of unused images after 30 minutes
    await ctx.scheduler.runAfter(30 * 60 * 1000, "journalEntries:cleanupUnusedImages", {
      userId: args.userId,
    });
  },
});

// Track a new image in the database
export const trackImage = mutation({
  args: {
    journalEntryId: v.id("journalEntries"),
    storageId: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    isInUse: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    
    return await ctx.db.insert("journalImages", {
      userId,
      journalEntryId: args.journalEntryId,
      storageId: args.storageId,
      uploadedAt: now,
      lastUsedAt: now,
      width: args.width,
      height: args.height,
      isInUse: args.isInUse,
    });
  },
});

// Update image usage status
export const updateImageUsage = mutation({
  args: {
    imageId: v.id("journalImages"),
    isInUse: v.boolean(),
    lastUsedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== userId) {
      throw new Error("Image not found or unauthorized");
    }

    const updates: any = {
      isInUse: args.isInUse,
    };

    if (args.lastUsedAt) {
      updates.lastUsedAt = args.lastUsedAt;
    }

    return await ctx.db.patch(args.imageId, updates);
  },
});

// Replace an image URL in journal content
export const replaceImageUrl = mutation({
  args: {
    entryId: v.id("journalEntries"),
    oldUrl: v.string(),
    newUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    // Deep clone the content
    const updatedContent = JSON.parse(JSON.stringify(entry.content));

    // Recursive function to replace image URLs
    function replaceImageSrc(node: any) {
      if (node.type === 'image' && node.attrs?.src === args.oldUrl) {
        node.attrs.src = args.newUrl;
      }

      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(replaceImageSrc);
      }
    }

    // Start replacement from the root
    if (updatedContent && updatedContent.content) {
      updatedContent.content.forEach(replaceImageSrc);
    }

    // Update the entry with the modified content
    return await ctx.db.patch(args.entryId, {
      content: updatedContent,
      updatedAt: Date.now(),
    });
  },
});

// Clean up unused images
export const cleanupUnusedImages = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find images that haven't been used for at least 30 minutes
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    
    const unusedImages = await ctx.runQuery("journalEntries:getUnusedImages", {
      userId: args.userId,
      cutoffTime: thirtyMinutesAgo,
    });

    // Delete each unused image
    for (const image of unusedImages) {
      try {
        // Delete from Convex storage
        await ctx.storage.delete(image.storageId as StorageId);
        
        // Delete from our database
        await ctx.runMutation("journalEntries:deleteImage", {
          imageId: image._id,
        });
      } catch (error) {
        console.error('Error deleting unused image:', error);
      }
    }
  },
});

// Delete an image from the database
export const deleteImage = mutation({
  args: {
    imageId: v.id("journalImages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const image = await ctx.db.get(args.imageId);
    if (!image || image.userId !== userId) {
      throw new Error("Image not found or unauthorized");
    }

    await ctx.db.delete(args.imageId);
  },
});

// Get images for a specific journal entry
export const getEntryImages = query({
  args: {
    entryId: v.id("journalEntries"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("journalImages")
      .withIndex("by_journal_entry", (q) => q.eq("journalEntryId", args.entryId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
  },
});

// Get unused images for cleanup
export const getUnusedImages = query({
  args: {
    userId: v.id("users"),
    cutoffTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journalImages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isInUse"), false),
          q.lt(q.field("lastUsedAt"), args.cutoffTime)
        )
      )
      .collect();
  },
});

// Delete all images associated with a journal entry
export const deleteEntryImages = action({
  args: {
    imageIds: v.array(v.id("journalImages")),
    storageIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Delete images from Convex storage
    for (const storageId of args.storageIds) {
      try {
        await ctx.storage.delete(storageId as StorageId);
      } catch (error) {
        console.error(`Error deleting image ${storageId} from storage:`, error);
      }
    }

    // Delete image records from database
    for (const imageId of args.imageIds) {
      await ctx.runMutation("journalEntries:deleteImage", {
        imageId,
      });
    }
  },
});

// Generate a URL for an image in storage
export const getImageUrl = query({
  args: {
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId as StorageId);
  },
});

// Upload a base64 image to storage
export const uploadImage = action({
  args: {
    base64Image: v.string(),
    journalEntryId: v.id("journalEntries"),
  },
  handler: async (ctx, args) => {
    try {
      // Extract the base64 data and MIME type
      const matches = args.base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return { success: false, error: "Invalid base64 image format" };
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Convert base64 to Uint8Array (browser-compatible)
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Upload to Convex storage
      const storageId = await ctx.storage.store(bytes);
      
      // Get the URL for the stored file
      const url = await ctx.storage.getUrl(storageId);
      
      if (url) {
        // Track the new image in our database
        const imageId = await ctx.runMutation("journalEntries:trackImage", {
          journalEntryId: args.journalEntryId,
          storageId,
          isInUse: true,
        });

        return { success: true, url, storageId, imageId };
      }
      
      return { success: false, error: "Failed to get URL for uploaded image" };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: "Failed to upload image" };
    }
  },
});

export const getUserJournalEntries = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 20;
    return await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

export const getJournalEntryById = query({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    return entry;
  },
});

export const deleteJournalEntry = mutation({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== userId) {
      throw new Error("Journal entry not found or unauthorized");
    }

    // Get all images associated with this entry
    const images = await ctx.db
      .query("journalImages")
      .withIndex("by_journal_entry", (q) => q.eq("journalEntryId", args.entryId))
      .collect();

    // Schedule image deletion
    if (images.length > 0) {
      await ctx.scheduler.runAfter(0, "journalEntries:deleteEntryImages", {
        imageIds: images.map(img => img._id),
        storageIds: images.map(img => img.storageId),
      });
    }

    await ctx.db.delete(args.entryId);
  },
});

export const searchJournalEntries = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const limit = args.limit || 10;
    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50); // Get more entries to search through

    // Simple text search in title and content
    return entries
      .filter((entry) => {
        const titleMatch = entry.title
          ?.toLowerCase()
          .includes(args.searchTerm.toLowerCase());
        const contentMatch = JSON.stringify(entry.content)
          .toLowerCase()
          .includes(args.searchTerm.toLowerCase());
        return titleMatch || contentMatch;
      })
      .slice(0, limit);
  },
});