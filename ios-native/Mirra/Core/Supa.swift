import Foundation
import Supabase

enum AppConfig {
    static let supabaseURL = URL(string: "https://nkarycrvlmtuuyqzvyvt.supabase.co")!
    // Publishable anon key — safe to ship in the client.
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYXJ5Y3J2bG10dXV5cXp2eXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTM0NDMsImV4cCI6MjA3OTA4OTQ0M30.Uab386Qr6ulFirqFslJRUjRMu832Pt_ZTwy0NBVIq7M"
    static let photoBucket = "user-photos"
}

let supa = SupabaseClient(supabaseURL: AppConfig.supabaseURL, supabaseKey: AppConfig.supabaseAnonKey)
