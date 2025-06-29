import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function TestEmailButton() {
  const sendTestEmail = useMutation(api.users.sendTestEmail);
  const sendWeeklyTestEmail = useMutation(api.users.sendWeeklyTestEmail);
  const { toast } = useToast();

  const handleSendTestEmail = async () => {
    try {
      const result = await sendTestEmail();
      toast({
        title: "Success",
        description: result,
      });
      console.log(result);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error(error);
    }
  };

  const handleSendWeeklyTestEmail = async () => {
    try {
      const result = await sendWeeklyTestEmail();
      toast({
        title: "Success",
        description: result,
      });
      console.log(result);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
      console.error(error);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleSendTestEmail}>Send Daily Test Email</Button>
      <Button onClick={handleSendWeeklyTestEmail}>
        Send Weekly Test Email
      </Button>
    </div>
  );
}
