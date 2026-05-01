'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
})

type ActionState = { error: string } | null

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validated = LoginSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    return { error: 'Invalid email or password. Please try again.' }
  }

  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}