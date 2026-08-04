"use client";

import { useAppStore } from "@/store/app-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bell, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppStore as useStore } from "@/store/app-store";

export function AlertModal() {
  const open = useAppStore((s) => s.alertModalOpen);
  const setOpen = useAppStore((s) => s.setAlertModalOpen);
  const rawQuery = useAppStore((s) => s.rawQuery);
  const filters = useAppStore((s) => s.filters);
  const setAlerts = useAppStore((s) => s.setAlerts);
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("weekly");
  const [creating, setCreating] = useState(false);

  // Pre-fill email from the user's profile
  useEffect(() => {
    if (open) {
      void fetch("/api/profile")
        .then((r) => r.json())
        .then((d) => {
          if (d.profile?.email) setEmail(d.profile.email);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleCreate = async () => {
    if (!rawQuery) {
      toast.error("Run a search first to create an alert");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: rawQuery, filters, frequency }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      // Refresh alerts list
      const alertsRes = await fetch("/api/alerts");
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        setAlerts(alertsData.alerts || []);
      }
      toast.success(`Alert created — you'll be notified ${frequency}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create alert");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Create Search Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when new papers match your search. We'll check daily or weekly for new publications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground">Query</Label>
            <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-sm">
              {rawQuery || "(no query yet)"}
            </div>
          </div>

          <div>
            <Label htmlFor="alert-email" className="text-xs text-muted-foreground">
              Email (for notifications)
            </Label>
            <Input
              id="alert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Note: email sending is on the V3 roadmap. For now, your alert is saved to the database.
            </p>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Frequency</Label>
            <RadioGroup
              value={frequency}
              onValueChange={(v) => setFrequency(v as "daily" | "weekly")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem id="alert-daily" value="daily" />
                <Label htmlFor="alert-daily" className="text-sm cursor-pointer">Daily</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem id="alert-weekly" value="weekly" />
                <Label htmlFor="alert-weekly" className="text-sm cursor-pointer">Weekly</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || !rawQuery}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            Create Alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
