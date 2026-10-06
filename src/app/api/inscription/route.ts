import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scrapeIadProfilePhoto } from "@/lib/iad-utils";

const DEFAULT_PASSWORD = process.env.PARTNER_DEFAULT_PASSWORD || "Roazhonkastell35";

const FORMULES: Record<string, number> = {
  conseiller: 19.99,
  bureau: 80,
};

export async function POST(request: Request) {
  try {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const data = await request.formData();
    const firstName = (data.get("firstName") as string)?.trim();
    const lastName = (data.get("lastName") as string)?.trim();
    const email = (data.get("email") as string)?.trim().toLowerCase();
    const phone = (data.get("phone") as string)?.trim();
    const iadId = (data.get("iadId") as string)?.trim();
    const rsacNumber = (data.get("rsacNumber") as string)?.trim();
    const rsacCity = (data.get("rsacCity") as string)?.trim();
    const formuleKey = (data.get("formule") as string)?.trim();
    const ribFile = data.get("rib") as File | null;

    if (!firstName || !lastName || !email || !phone || !iadId || !rsacNumber || !rsacCity || !formuleKey) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être remplis." }, { status: 400 });
    }

    const cotisation = FORMULES[formuleKey];
    if (cotisation === undefined) {
      return NextResponse.json({ error: "Formule invalide." }, { status: 400 });
    }

    const { data: existingUsers } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email,
    );

    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 400 });
    }

    const { data: createData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    const userId = createData.user.id;

    let ribUrl: string | null = null;
    if (ribFile && ribFile.size > 0) {
      const ext = ribFile.name.split(".").pop() || "pdf";
      const path = `ribs/${userId}.${ext}`;
      const buffer = Buffer.from(await ribFile.arrayBuffer());

      const { error: uploadError } = await adminClient.storage
        .from("photos")
        .upload(path, buffer, {
          contentType: ribFile.type,
          upsert: true,
        });

      if (!uploadError) {
        const { data: urlData } = adminClient.storage.from("photos").getPublicUrl(path);
        ribUrl = urlData.publicUrl;
      }
    }

    await adminClient.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      phone,
      iad_id: iadId,
      rsac_number: rsacNumber,
      rsac_city: rsacCity,
      formule_adhesion: formuleKey,
      cotisation_mensuelle: cotisation,
      rib_url: ribUrl,
      member_status: "en_attente",
      roles: ["adherent"],
    }).eq("id", userId);

    scrapeIadProfilePhoto(firstName, lastName).then((photoUrl) => {
      if (photoUrl) {
        adminClient.from("profiles").update({ photo_url: photoUrl }).eq("id", userId);
      }
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne";
    return NextResponse.json({ error: `Erreur serveur : ${message}` }, { status: 500 });
  }
}
