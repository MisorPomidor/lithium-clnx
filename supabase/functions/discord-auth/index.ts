import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Discord role IDs
const ROLE_IDS = {
  HIGH_STAFF: Deno.env.get('DISCORD_ROLE_HIGH_STAFF')!,
  MAIN: Deno.env.get('DISCORD_ROLE_MAIN')!,
  TEST: Deno.env.get('DISCORD_ROLE_TEST')!,
  NEWBIE: Deno.env.get('DISCORD_ROLE_NEWBIE')!,
}

const DISCORD_SERVER_ID = Deno.env.get('DISCORD_SERVER_ID')!
const DISCORD_BOT_TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!
const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID')!
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET')!

interface DiscordUser {
  id: string
  username: string
  avatar: string | null
  discriminator: string
  global_name?: string
}

interface GuildMember {
  roles: string[]
  user: DiscordUser
}

// Determine rank from Discord roles
function getRankFromRoles(roles: string[]): { rank: string; isAdmin: boolean } | null {
  const isAdmin = roles.includes(ROLE_IDS.HIGH_STAFF)
  
  if (roles.includes(ROLE_IDS.HIGH_STAFF)) {
    return { rank: 'high_staff', isAdmin: true }
  }
  if (roles.includes(ROLE_IDS.MAIN)) {
    return { rank: 'main', isAdmin }
  }
  if (roles.includes(ROLE_IDS.TEST)) {
    return { rank: 'test', isAdmin }
  }
  if (roles.includes(ROLE_IDS.NEWBIE)) {
    return { rank: 'newbie', isAdmin }
  }
  
  return null // No valid role
}

// Calculate next rank deadline (30 days from now)
function getNextRankDeadline(): string {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 30)
  return deadline.toISOString()
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    // Step 1: Get OAuth URL
    if (action === 'get_oauth_url') {
      const redirectUri = url.searchParams.get('redirect_uri')
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ error: 'redirect_uri is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const oauthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify+guilds.members.read`
      
      return new Response(
        JSON.stringify({ url: oauthUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Exchange code for token and verify membership
    if (action === 'callback') {
      const { code, redirect_uri } = await req.json()

      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'code and redirect_uri are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code,
          redirect_uri,
        }),
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text()
        console.error('Token exchange failed:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to exchange code for token' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access_token

      // Get user info
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!userResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to get user info' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const discordUser: DiscordUser = await userResponse.json()

      // Get guild member info using bot token
      const memberResponse = await fetch(
        `https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordUser.id}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      )

      if (!memberResponse.ok) {
        if (memberResponse.status === 404) {
          return new Response(
            JSON.stringify({ error: 'not_member', message: 'Вы не являетесь участником Discord сервера' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        const error = await memberResponse.text()
        console.error('Member fetch failed:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to verify server membership' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const memberData: GuildMember = await memberResponse.json()
      const roleInfo = getRankFromRoles(memberData.roles)

      if (!roleInfo) {
        return new Response(
          JSON.stringify({ error: 'no_role', message: 'У вас нет доступа. Необходима роль на сервере.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create Supabase client with service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      let user = existingUsers?.users?.find(u => u.user_metadata?.discord_id === discordUser.id)

      if (!user) {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: `${discordUser.id}@discord.local`,
          email_confirm: true,
          user_metadata: {
            discord_id: discordUser.id,
            discord_username: discordUser.global_name || discordUser.username,
            discord_avatar: discordUser.avatar,
          },
        })

        if (createError) {
          console.error('User creation error:', createError)
          return new Response(
            JSON.stringify({ error: 'Failed to create user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        user = newUser.user

        // Create profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: user.id,
            discord_id: discordUser.id,
            discord_username: discordUser.global_name || discordUser.username,
            discord_avatar: discordUser.avatar,
            current_rank: roleInfo.rank,
            is_admin: roleInfo.isAdmin,
            next_rank_deadline: getNextRankDeadline(),
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      } else {
        // Update existing profile
        await supabaseAdmin
          .from('profiles')
          .update({
            discord_username: discordUser.global_name || discordUser.username,
            discord_avatar: discordUser.avatar,
            current_rank: roleInfo.rank,
            is_admin: roleInfo.isAdmin,
          })
          .eq('user_id', user.id)
      }

      // Generate session token
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
      })

      if (sessionError) {
        console.error('Session generation error:', sessionError)
        return new Response(
          JSON.stringify({ error: 'Failed to generate session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Extract token from the magic link
      const magicLinkUrl = new URL(sessionData.properties.hashed_token ? 
        `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${sessionData.properties.hashed_token}&type=magiclink` : 
        sessionData.properties.action_link)

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            id: user.id,
            discord_id: discordUser.id,
            discord_username: discordUser.global_name || discordUser.username,
            discord_avatar: discordUser.avatar,
            rank: roleInfo.rank,
            is_admin: roleInfo.isAdmin,
          },
          verification_url: sessionData.properties.action_link,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Refresh user roles from Discord
    if (action === 'refresh_roles') {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const discordId = user.user_metadata?.discord_id
      if (!discordId) {
        return new Response(
          JSON.stringify({ error: 'No Discord ID found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get member info from Discord
      const memberResponse = await fetch(
        `https://discord.com/api/guilds/${DISCORD_SERVER_ID}/members/${discordId}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      )

      if (!memberResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch Discord roles' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const memberData: GuildMember = await memberResponse.json()
      const roleInfo = getRankFromRoles(memberData.roles)

      if (!roleInfo) {
        return new Response(
          JSON.stringify({ error: 'no_role', message: 'У вас больше нет доступа' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update profile with service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      await supabaseAdmin
        .from('profiles')
        .update({
          current_rank: roleInfo.rank,
          is_admin: roleInfo.isAdmin,
        })
        .eq('user_id', user.id)

      return new Response(
        JSON.stringify({
          success: true,
          rank: roleInfo.rank,
          is_admin: roleInfo.isAdmin,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})