import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyFriendsRequest {
  userId: string;
  eventId: string;
  eventTitle: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, eventId, eventTitle, userName }: NotifyFriendsRequest = await req.json();

    console.log(`Notifying friends of user ${userId} about event ${eventId}`);

    // Get user's friends
    const { data: friendships, error: friendError } = await supabase
      .from("friendships")
      .select("user_id, friend_id")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (friendError) {
      console.error("Error fetching friendships:", friendError);
      throw friendError;
    }

    if (!friendships || friendships.length === 0) {
      console.log("No friends to notify");
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get friend IDs
    const friendIds = friendships.map((f) =>
      f.user_id === userId ? f.friend_id : f.user_id
    );

    // Get push subscriptions for friends
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", friendIds);

    if (subError) {
      console.error("Error fetching push subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for friends");
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Note: In a production environment, you would send actual push notifications here
    // This requires VAPID keys and web-push library integration
    // For now, we'll log the notification intent

    console.log(`Would notify ${subscriptions.length} friends about event: ${eventTitle}`);
    console.log(`Notification message: "${userName} a ajouté "${eventTitle}" à son calendrier ! Veux-tu y aller avec lui 😁"`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified: subscriptions.length,
        message: `${userName} a ajouté "${eventTitle}" à son calendrier ! Veux-tu y aller avec lui 😁`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in notify-friends-calendar:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
