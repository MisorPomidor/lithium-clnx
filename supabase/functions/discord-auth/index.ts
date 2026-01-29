import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, discordData } = await req.json();

    if (action === "sync_discord_roles") {
      // This would be called by a webhook or periodic sync
      // For now, we'll update based on discordData passed from frontend
      if (!userId || !discordData) {
        return new Response(
          JSON.stringify({ error: "Missing userId or discordData" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { roles, guildMember } = discordData;
      
      // Determine access based on roles
      const hasAccess = roles && roles.length > 0;
      const isHighStaff = roles?.some((role: string) => 
        role.toLowerCase().includes("high staff") || 
        role.toLowerCase().includes("highstaff") ||
        role.toLowerCase().includes("admin")
      );

      // Determine rank based on roles
      let rank = 'Newbie';
      let highestRole = 'Newbie';
      
      if (roles) {
        for (const role of roles) {
          const roleLower = role.toLowerCase();
          if (roleLower.includes('main') || roleLower.includes('основной')) {
            rank = 'Main';
            highestRole = role;
            break;
          } else if (roleLower.includes('test') || roleLower.includes('тест')) {
            if (rank !== 'Main') {
              rank = 'Test';
              highestRole = role;
            }
          } else if (rank === 'Newbie') {
            highestRole = role;
          }
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          has_access: hasAccess,
          is_high_staff: isHighStaff,
          rank,
          highest_role: highestRole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating profile:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, hasAccess, isHighStaff, rank }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
