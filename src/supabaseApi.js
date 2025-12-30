import { supabase } from './supabaseClient'

// --------------------
// AUTH
// --------------------

export const supabaseLogin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data.user
}

export const supabaseRegister = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  if (error) throw error
  return data.user
}

export const supabaseLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}