import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  Award,
  ChevronLeft,
  Dumbbell,
  Edit2,
  Plus,
  Save,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { uid, useGym } from "../lib/gym-store";
import { pullClientDataForCoach } from "../lib/supabase-sync";
import { supabase } from "../lib/supabase";

export const Route = createFileRoute("/coach")({
  component: CoachDashboardPage,
});

function CoachDashboardPage() {
  const store = useGym();
  const isCoach = store.userProfile?.role === "coach";
  const [clients, setClients] = useState<any[]>(store.clients || []);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const [showAddModal, setShowAuthModal] = useState(false);

  // Coach Program Management state
  const [newProgramName, setNewProgramName] = useState("");
  const [editingNutrition, setEditingNutrition] = useState(false);
  const [calTarget, setCalTarget] = useState(2000);
  const [protTarget, setProtTarget] = useState(140);
  const [carbTarget, setCarbTarget] = useState(200);
  const [fatTarget, setFatTarget] = useState(65);

  const loadCoachClients = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("coach_clients")
      .select("id, client_id, created_at, profiles!coach_clients_client_id_fkey(email, full_name, weight_kg)")
      .eq("coach_id", user.id);

    if (data) {
      setClients(data);
    }
  };

  useEffect(() => {
    if (isCoach) {
      loadCoachClients();
    }
  }, [isCoach]);

  useEffect(() => {
    if (!selectedClientId) {
      setClientDetails(null);
      return;
    }

    setLoadingDetails(true);
    pullClientDataForCoach(selectedClientId).then((res) => {
      setClientDetails(res);
      setLoadingDetails(false);
    });
  }, [selectedClientId]);

  // Add Client by Email via RPC lookup
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteMsg("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("מנוי לא מחובר");

      // Call secure lookup function
      const { data: lookupRes, error: lookupErr } = await supabase.rpc(
        "lookup_client_id_by_email",
        { lookup_email: inviteEmail.trim() }
      );

      if (lookupErr || !lookupRes || lookupRes.length === 0) {
        throw new Error("משתמש לא נמצא. יש לוודא שהמתאמן נרשם ל-GymTrack בכתובת זו.");
      }

      const foundClientId = lookupRes[0].client_id;

      const { error: linkErr } = await supabase.from("coach_clients").insert({
        coach_id: user.id,
        client_id: foundClientId,
      });

      if (linkErr) throw linkErr;

      setInviteMsg("המתאמן שויך בהצלחה לחשבון המאמן שלך!");
      setInviteEmail("");
      setShowAuthModal(false);
      loadCoachClients();
    } catch (err: any) {
      setInviteMsg(err?.message || "אירעה שגיאה בשיוך המתאמן");
    }
  };

  // Remove Client
  const handleRemoveClient = async (linkId: string) => {
    if (!confirm("האם למחוק את המתאמן מלוח הבקרה שלך?")) return;

    await supabase.from("coach_clients").delete().eq("id", linkId);
    if (selectedClientId === clients.find((c) => c.id === linkId)?.client_id) {
      setSelectedClientId(null);
    }
    loadCoachClients();
  };

  // Create Program for Client
  const handleCreateClientProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !newProgramName.trim()) return;

    const programId = uid();
    const { error } = await supabase.from("programs").insert({
      id: programId,
      user_id: selectedClientId,
      name: newProgramName.trim(),
      description: "תוכנית נבנתה על ידי המאמן",
    });

    if (!error) {
      setNewProgramName("");
      pullClientDataForCoach(selectedClientId).then(setClientDetails);
    }
  };

  // Save Nutrition Targets for Client
  const handleSaveNutritionTargets = async () => {
    if (!selectedClientId) return;
    const today = new Date().toISOString().slice(0, 10);

    const { error } = await supabase.from("nutrition_days").upsert({
      id: `${selectedClientId}_${today}`,
      user_id: selectedClientId,
      date: today,
      target_calories: calTarget,
      updated_at: new Date().toISOString(),
    });

    if (!error) {
      setEditingNutrition(false);
      pullClientDataForCoach(selectedClientId).then(setClientDetails);
    }
  };

  if (!isCoach) {
    return (
      <AppShell title="דשבורד מאמן" kicker="מאמנים וצוות מקצועי">
        <div className="surface-card p-6 text-center space-y-4 rounded-3xl mt-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">גישת מאמן מוגבלת</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            חשבונך מוגדר כחבר/מתאמן (Client). דשבורד זה מיועד למאמנים אישיים בלבד לניהול תוכניות ותזונת מתאמנים.
          </p>
        </div>
      </AppShell>
    );
  }

  const selectedClientInfo = clients.find((c) => c.client_id === selectedClientId);

  return (
    <AppShell
      title="לוח בקרה למאמן"
      subtitle="ניהול תוכניות אימון, תזונה ומעקב מתאמנים"
      kicker="מאמן מוסמך"
      action={
        <button
          onClick={() => setShowAuthModal(true)}
          className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>הוסף מתאמן</span>
        </button>
      }
    >
      <div className="space-y-5">
        {/* Coach Header Banner */}
        <div className="surface-card p-5 rounded-3xl space-y-3 bg-linear-to-br from-rose-50/60 to-primary/5 border border-primary/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-ink">לוח מאמן פעיל</h3>
                <p className="text-xs text-muted-foreground">
                  {clients.length} מתאמנים רשומים תחת לוח זה
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
              <UserCheck className="h-3 w-3" /> מחובר כמאמן
            </span>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" /> רשימת המתאמנים שלי
            </h3>
          </div>

          {clients.length === 0 ? (
            <div className="surface-card p-6 text-center text-muted-foreground rounded-2xl text-xs space-y-2">
              <p>עדיין לא שויכו מתאמנים לחשבון המאמן שלך.</p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                לחצי כאן להוספת מתאמן ראשון לפי אימייל
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {clients.map((c) => {
                const isSelected = c.client_id === selectedClientId;
                const emailStr = c.profiles?.email || "מתאמן";
                const nameStr = c.profiles?.full_name || emailStr.split("@")[0];

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClientId(isSelected ? null : c.client_id)}
                    className={`surface-card p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs"
                        : "border-border/60 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {nameStr.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-ink">{nameStr}</h4>
                        <p className="text-xs text-muted-foreground">{emailStr}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClient(c.id);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="הסר מתאמן"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ChevronLeft
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isSelected ? "-rotate-90 text-primary" : ""
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Client Full Coach Workspace */}
        {selectedClientId && (
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <span>תיק מתאמן:</span>
                <span className="text-primary font-extrabold">
                  {selectedClientInfo?.profiles?.full_name || selectedClientInfo?.profiles?.email}
                </span>
              </h3>
            </div>

            {loadingDetails ? (
              <div className="surface-card p-6 text-center text-xs text-muted-foreground animate-pulse">
                טוען נתוני מתאמן מ-Supabase...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Client Programs & Creation */}
                <div className="surface-card p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <Dumbbell className="h-4 w-4 text-primary" /> תוכניות אימונים למתאמן
                    </h4>
                  </div>

                  <form onSubmit={handleCreateClientProgram} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newProgramName}
                      onChange={(e) => setNewProgramName(e.target.value)}
                      placeholder="שם תוכנית חדשה למתאמן..."
                      className="flex-1 rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>צור</span>
                    </button>
                  </form>

                  {clientDetails?.programs?.length === 0 ? (
                    <p className="text-xs text-muted-foreground pt-1">
                      למתאמן זה אין תוכנית אימון פעילה כרגע.
                    </p>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {clientDetails?.programs?.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-xl bg-muted/40 p-2.5 text-xs font-semibold"
                        >
                          <span>{p.name}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {p.dayIds?.length || 0} ימי אימון
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Client Nutrition Targets Editor */}
                <div className="surface-card p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-sm text-ink flex items-center gap-1.5">
                      <Apple className="h-4 w-4 text-primary" /> יעד קלורי ותזונה למתאמן
                    </h4>
                    <button
                      onClick={() => setEditingNutrition(!editingNutrition)}
                      className="text-primary text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{editingNutrition ? "ביטול" : "ערוך יעדים"}</span>
                    </button>
                  </div>

                  {editingNutrition ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          יעד קלוריות יומי (kcal)
                        </label>
                        <input
                          type="number"
                          value={calTarget}
                          onChange={(e) => setCalTarget(Number(e.target.value))}
                          className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <button
                        onClick={handleSaveNutritionTargets}
                        className="w-full rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-xs hover:bg-primary/90 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>שמור יעד מותאם למתאמן</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-primary/5 p-2 border border-primary/10">
                        <span className="block text-[10px] text-muted-foreground">קלוריות</span>
                        <span className="font-bold text-ink">
                          {clientDetails?.nutritionDays?.[0]?.target_calories || 2000} kcal
                        </span>
                      </div>
                      <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-100">
                        <span className="block text-[10px] text-emerald-600">ימי מעקב</span>
                        <span className="font-bold text-emerald-800">
                          {clientDetails?.nutritionDays?.length || 0} ימים
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base text-ink flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" /> שיוך מתאמן חדש
                </h3>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-muted-foreground hover:text-ink font-bold text-sm px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {inviteMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold border ${
                    inviteMsg.includes("בהצלחה")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}
                >
                  {inviteMsg}
                </div>
              )}

              <form onSubmit={handleAddClient} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">
                    אימייל המתאמן הרשום במערכת
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                    placeholder="client@example.com"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  שייך מתאמן לחשבוני
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
