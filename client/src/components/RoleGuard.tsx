import { Shield } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';

interface RoleGuardProps {
  allowed: boolean;
  children: React.ReactNode;
  message?: string;
}

export default function RoleGuard({ allowed, children, message }: RoleGuardProps) {
  if (allowed) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
          <div className="bg-destructive/10 p-4 rounded-full">
            <Shield className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {message ?? "You don't have permission to view this page."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
