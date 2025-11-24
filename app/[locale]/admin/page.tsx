import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const user = await currentUser();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--fg))]">Admin Dashboard</h1>
        <p className="text-[hsl(var(--globe-grey))] mt-2">
          Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Manage legal templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              View and manage all legal templates in the system.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>User management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Manage user accounts and permissions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              View document generation and usage analytics.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>System configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[hsl(var(--globe-grey))]">
              Configure system settings and preferences.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>Account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {user.emailAddresses[0]?.emailAddress}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">User ID:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {user.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Created:</span>
              <span className="text-sm text-[hsl(var(--globe-grey))]">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
