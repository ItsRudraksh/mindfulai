"use node";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import type { Doc } from "./_generated/dataModel";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY environment variable not set!");
}
const googleClient = new GoogleGenAI({
  apiKey: geminiApiKey,
});
const googleModel = "gemini-2.5-flash";

async function generateEmailContent(
  userName: string,
  globalMemory: string
): Promise<{ text: string; html: string }> {
  try {
    const systemPrompt = `You are a warm, gentle, and emotionally intelligent assistant for Mindful AI — a thoughtful platform that sends daily letters to nurture users' mental and emotional well-being.

Write a short, beautiful email (under 100 words) that feels like a comforting note from a dear friend. Make it poetic, soothing, and deeply human. Personalize it based on the user's recent thoughts, emotions, or reflections, as shared in their global memory.

The tone should be calming, hopeful, and full of empathy. Speak directly to the heart. Use natural, expressive language — metaphors, imagery, and soft encouragement are welcome.

Avoid robotic or generic language.End with this warm sign-off:
"Your friends at Mindful AI"`;

    const userPrompt = `User's name: ${userName}\nUser's emotional context: "${globalMemory}"`;

    const response = await googleClient.models.generateContent({
      model: googleModel,
      config: {
        maxOutputTokens: 4000,
        temperature: 0.85,
        systemInstruction: systemPrompt,
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const body =
      response.text?.trim() ||
      `Just a little reminder that you matter, more than you know. 🌿\n\nYour friends at Mindful AI`;

    const html = `<div style="font-family: 'Georgia', serif; color: #444; line-height: 1.6; max-width: 600px; margin: auto; padding: 24px; background-color: #f9f9f9; border-radius: 12px;">
    <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>${userName}</strong>,</p>
    ${body
      .split("\n\n")
      .map(
        (para) =>
          `<p style="font-size: 16px; margin-bottom: 16px;">${para.replace(
            /\n/g,
            " "
          )}</p>`
      )
      .join("")}
  </div>
`;

    const plainText = `Dear ${userName},\n\n${body}`;

    return { text: plainText, html };
  } catch (error) {
    console.error("Error generating email content:", error);
    const fallback = `Just a little reminder that you matter, more than you know. 🌿\n\nYour friends at Mindful AI`;
    return {
      text: `Dear ${userName},\n\n${fallback}\n\nWith warmth,\nYour friends at Mindful AI`,
      html: `
        <div style="font-family: 'Georgia', serif; color: #444; line-height: 1.6; max-width: 600px; margin: auto; padding: 24px; background-color: #f9f9f9; border-radius: 12px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Dear <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 16px;">${fallback}</p>
          <p style="font-size: 16px; margin-top: 32px;">
            With warmth,<br/>
            <strong>Your friends at Mindful AI</strong>
          </p>
        </div>
      `,
    };
  }
}

// Action to be called by the cron job
export const sendDailyEmailsToProUsers = internalAction({
  handler: async (ctx) => {
    const proUsers = await ctx.runQuery(internal.users.getProUsers);

    for (const user of proUsers) {
      if (user.globalMemory && user.email && user.name) {
        await ctx.runAction(internal.email.sendEmail, {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          globalMemory: user.globalMemory
            .replace(/\n/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        });
      }
    }
  },
});

export const sendEmail = internalAction({
  args: {
    userId: v.id("users"),
    userName: v.string(),
    userEmail: v.string(),
    globalMemory: v.string(),
  },
  handler: async (ctx, { userName, userEmail, globalMemory }) => {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    if (!mailUser || !mailPass || !mailHost) {
      console.error("Missing email environment variables.");
      return "Missing environment variables.";
    }

    // 1. Generate Email Content with Google AI
    const emailBody = await generateEmailContent(userName, globalMemory);

    // 2. Send Email with Nodemailer
    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    try {
      await transporter.sendMail({
        from: `"Mindful AI" <${mailUser}>`,
        to: userEmail,
        subject: `A little something for you, ${userName} ✨`,
        html: emailBody.html,
        text: emailBody.text,
      });
      return "Email sent successfully.";
    } catch (error) {
      console.error("Error sending email:", error);
      return "Failed to send email.";
    }
  },
});

// --- Weekly Report Email ---

async function generateWeeklyEmailContent(
  userName: string,
  globalMemory: string,
  sessionsLastWeek: Array<any>
): Promise<{ text: string; html: string }> {
  try {
    const sessionSummary = sessionsLastWeek
      .map(
        (s) =>
          `- A ${s.type} session on ${new Date(
            s._creationTime
          ).toLocaleDateString()} that lasted ${Math.round(
            s.duration / 60000
          )} minutes.`
      )
      .join("\n");

    const systemPrompt = `You are a deeply insightful and caring AI companion from Mindful AI. Your purpose is to send a weekly reflection that feels like a personal, handwritten letter from a wise and empathetic friend. This is not a generic report; it's a moment of genuine connection.

TASK: Write a thoughtful, analytical, and encouraging weekly email (200-300 words). Use the user's global memory and their session activity from the past week to craft a highly personal message.

TONE & STYLE:
- Human & Authentic: Use a natural, conversational, and warm tone. Refer to shared context like a friend would.
- Insightful & Analytical: Connect dots between their global memory (long-term context) and recent activity (short-term behavior). Offer gentle, valuable insights.
- Empathetic & Encouraging: Validate their journey, celebrate progress, and offer gentle encouragement for the week ahead.
- Adaptable:
  - If they were active: Appreciate their effort ("I was just thinking about your progress this week...").
  - If they were inactive: Acknowledge their absence with warmth and care ("It's been a little while since we last connected, and I wanted to reach out...").
  - If it was a tough week (inferred from memory/sessions): Acknowledge the struggle with compassion ("It sounds like this past week was a challenging one...").

STRUCTURE:
1.  **Personal Opening**: Start with a warm, personal greeting that reflects their recent activity level.
2.  **Reflection & Insight**: Briefly summarize their week's activity (or lack thereof) and connect it to their broader goals or feelings from their global memory. What patterns do you see? What does this say about their journey?
3.  **Appreciation or Encouragement**: If they made progress, praise them specifically. If they were inactive or struggling, offer gentle, no-pressure encouragement and maybe a small, actionable suggestion.
4.  **Look Ahead**: Offer a simple, kind thought or recommendation for the coming week.
5.  **Warm Closing**: Sign off as "Your friends at Mindful AI".

Generate a beautiful, well-formatted email body.`;

    const userPrompt = `User's Name: ${userName}

User's Global Memory (Their long-term context, goals, and personality):
"${globalMemory}"

User's Session Activity Last Week:
${
  sessionsLastWeek.length > 0 ?
    sessionSummary
  : "No sessions recorded in the last 7 days."
}

Based on all this, write the weekly reflection email.`;

    const result = await googleClient.models.generateContent({
      model: googleModel,
      config: {
        maxOutputTokens: 5000,
        temperature: 0.75,
        systemInstruction: systemPrompt,
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const body =
      result.text?.trim() ||
      "Thinking of you this week and sending our best wishes for the days ahead. Remember to be kind to yourself. You're doing great.";

    const html = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.7; max-width: 600px; margin: auto; padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
      <p style="font-size: 16px; margin-bottom: 24px;">Hi <strong>${userName}</strong>,</p>
      ${body
        .split("\n\n")
        .map(
          (para) =>
            `<p style="font-size: 16px; margin-bottom: 18px;">${para.replace(
              /\n/g,
              " "
            )}</p>`
        )
        .join("")}
    </div>`;

    const plainText = `Hi ${userName},\n\n${body}`;

    return { text: plainText, html };
  } catch (error) {
    console.error("Error generating weekly email content:", error);
    const fallback = `Thinking of you this week and sending our best wishes for the days ahead. Remember to be kind to yourself. You're doing great.`;
    return {
      text: `Hi ${userName},\n\n${fallback}\n\nWith warmth,\nYour friends at Mindful AI`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; line-height: 1.7; max-width: 600px; margin: auto; padding: 30px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi <strong>${userName}</strong>,</p>
          <p style="font-size: 16px; margin-bottom: 18px;">${fallback}</p>
          <p style="font-size: 16px; margin-top: 32px;">
            With warmth,<br/>
            <strong>Your friends at Mindful AI</strong>
          </p>
        </div>
      `,
    };
  }
}

export const sendWeeklyEmailsToProUsers = internalAction({
  handler: async (ctx) => {
    const proUsers = await ctx.runQuery(internal.users.getProUsers);
    for (const user of proUsers) {
      await ctx.runAction(internal.email.sendWeeklyReportEmail, {
        userId: user._id,
      });
    }
  },
});

export const sendWeeklyReportEmail = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }): Promise<string> => {
    const user: Doc<"users"> | null = await ctx.runQuery(
      internal.users.getUserById,
      { userId }
    );

    if (!user || !user.email || !user.name || !user.globalMemory) {
      console.log(`Skipping weekly email for user ${userId}: missing data.`);
      return "User data incomplete.";
    }

    const sessionsLastWeek = await ctx.runQuery(
      internal.sessions.getSessionsForUserInLastWeek,
      { userId }
    );

    const emailContent = await generateWeeklyEmailContent(
      user.name,
      user.globalMemory,
      sessionsLastWeek
    );

    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    if (!mailUser || !mailPass || !mailHost) {
      console.error("Missing email environment variables.");
      return "Missing environment variables.";
    }

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: { user: mailUser, pass: mailPass },
    });

    try {
      await transporter.sendMail({
        from: `"Mindful AI" <${mailUser}>`,
        to: user.email,
        subject: `Your Weekly Reflection from Mindful AI`,
        html: emailContent.html,
        text: emailContent.text,
      });
      return `Weekly email sent to ${user.name}.`;
    } catch (error) {
      console.error(`Error sending weekly email to ${user.name}:`, error);
      return "Failed to send weekly email.";
    }
  },
});

// --- Welcome Email ---

export const sendWelcomeEmail = internalAction({
  args: {
    userName: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, { userName, userEmail }) => {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    if (!mailUser || !mailPass || !mailHost) {
      console.error("Missing email environment variables for welcome email.");
      return "Missing environment variables.";
    }

    const emailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 25px; background-color: #fafafa; border-radius: 10px; border: 1px solid #eee;">
        <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">Welcome to Mindful AI, ${userName}!</h1>
        <p style="font-size: 16px; margin-bottom: 15px;">We are so grateful to have you join our community. Your journey towards a more mindful and balanced life is important, and we're here to support you every step of the way.</p>
        <p style="font-size: 16px; margin-bottom: 25px;">Feel free to explore the different sessions, start a journal, or simply check in with your mood. There's no right or wrong way to begin.</p>
        <a href="https://your-app-url.com/dashboard" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Go to Your Dashboard</a>
        <p style="font-size: 14px; margin-top: 30px; color: #777;">If you have any questions, don't hesitate to reach out.</p>
        <p style="font-size: 16px; margin-top: 20px;">With warmth,<br/><strong>The Mindful AI Team</strong></p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: { user: mailUser, pass: mailPass },
    });

    try {
      await transporter.sendMail({
        from: `"The Mindful AI Team" <${mailUser}>`,
        to: userEmail,
        subject: `Welcome to Your Mindful Journey, ${userName}!`,
        html: emailHtml,
      });
      return `Welcome email sent to ${userName}.`;
    } catch (error) {
      console.error(`Error sending welcome email to ${userName}:`, error);
      return "Failed to send welcome email.";
    }
  },
});

// --- Subscription Emails ---

export const sendProWelcomeEmail = internalAction({
  args: { userName: v.string(), userEmail: v.string() },
  handler: async (ctx, { userName, userEmail }) => {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    if (!mailUser || !mailPass || !mailHost) {
      return "Missing email environment variables.";
    }

    const emailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 25px; background-color: #fafafa; border-radius: 10px; border: 1px solid #eee;">
        <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">Welcome to Mindful AI Pro, ${userName}!</h1>
        <p style="font-size: 16px; margin-bottom: 15px;">Thank you for upgrading! You've just unlocked unlimited access to all our features, including video sessions, voice calls, and in-depth analytics.</p>
        <p style="font-size: 16px; margin-bottom: 25px;">We're excited to be a bigger part of your mental wellness journey. Explore your new benefits and continue to grow.</p>
        <a href="https://your-app-url.com/dashboard" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">Explore Pro Features</a>
        <p style="font-size: 16px; margin-top: 30px;">With warmth,<br/><strong>The Mindful AI Team</strong></p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: { user: mailUser, pass: mailPass },
    });

    try {
      await transporter.sendMail({
        from: `"The Mindful AI Team" <${mailUser}>`,
        to: userEmail,
        subject: `You've Unlocked Mindful AI Pro!`,
        html: emailHtml,
      });
      return `Pro welcome email sent to ${userName}.`;
    } catch (error) {
      return "Failed to send pro welcome email.";
    }
  },
});

export const sendCancellationEmail = internalAction({
  args: {
    userName: v.string(),
    userEmail: v.string(),
    periodEnd: v.string(),
  },
  handler: async (ctx, { userName, userEmail, periodEnd }) => {
    const mailUser = process.env.MAIL_USER;
    const mailPass = process.env.MAIL_PASS;
    const mailHost = process.env.MAIL_HOST;

    if (!mailUser || !mailPass || !mailHost) {
      return "Missing email environment variables.";
    }

    const emailHtml = `
      <div style="font-family: 'Inter', Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; padding: 25px; background-color: #fafafa; border-radius: 10px; border: 1px solid #eee;">
        <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">We're sad to see you go, ${userName}</h1>
        <p style="font-size: 16px; margin-bottom: 15px;">Your Mindful AI Pro subscription has been cancelled. We're sorry to see you go, but we respect your decision.</p>
        <p style="font-size: 16px; margin-bottom: 25px;">You will continue to have access to all Pro features until the end of your billing period on <strong>${periodEnd}</strong>.</p>
        <p style="font-size: 14px; margin-top: 30px; color: #777;">We'd love to hear any feedback you have. It helps us grow and improve.</p>
        <p style="font-size: 16px; margin-top: 20px;">Wishing you all the best,<br/><strong>The Mindful AI Team</strong></p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: mailHost,
      port: 587,
      secure: false,
      auth: { user: mailUser, pass: mailPass },
    });

    try {
      await transporter.sendMail({
        from: `"The Mindful AI Team" <${mailUser}>`,
        to: userEmail,
        subject: `Your Mindful AI Subscription Has Been Cancelled`,
        html: emailHtml,
      });
      return `Cancellation email sent to ${userName}.`;
    } catch (error) {
      return "Failed to send cancellation email.";
    }
  },
});
