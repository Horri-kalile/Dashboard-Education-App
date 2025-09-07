import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DebugPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let studentData = null;
  if (user) {
    const { data } = await supabase
      .from("students")
      .select("email, is_admin")
      .eq("id", user.id)
      .single();
    studentData = data;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Debug Info</h2>

          {user ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">User Email:</p>
                <p className="font-mono text-sm">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">User ID:</p>
                <p className="font-mono text-xs break-all">{user.id}</p>
              </div>

              {studentData ? (
                <div>
                  <p className="text-sm text-gray-600">Is Admin:</p>
                  <p
                    className={`font-bold ${
                      studentData.is_admin ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {studentData.is_admin ? "YES" : "NO"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-600">No student record found</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-red-600">No user logged in</p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <Link
              href="/login"
              className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Go to Login
            </Link>
            <Link
              href="/"
              className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
