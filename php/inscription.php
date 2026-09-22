<?php
/**
 * Endpoint d'inscription aux événements — Roazhon Kastell
 * Reçoit les données du formulaire en JSON (POST)
 * et les enregistre dans un fichier CSV par événement.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Données invalides"]);
    exit;
}

// Champs communs obligatoires
$required = ["nom", "prenom", "email", "evenement", "eventId"];
foreach ($required as $field) {
    if (empty($data[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Champ manquant : $field"]);
        exit;
    }
}

// Dossier de stockage
$csvDir = __DIR__ . "/data";
if (!is_dir($csvDir)) {
    mkdir($csvDir, 0755, true);
}

// Fichier CSV nommé par eventId (un fichier par événement)
$eventId = preg_replace('/[^a-z0-9\-]/', '', strtolower($data["eventId"]));
$csvFile = $csvDir . "/inscriptions-" . $eventId . ".csv";

$formType = $data["formType"] ?? "standard";
$isNew = !file_exists($csvFile);
$fp = fopen($csvFile, "a");

if (!$fp) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur serveur"]);
    exit;
}

// BOM UTF-8 + en-têtes selon le type de formulaire
if ($isNew) {
    fwrite($fp, "\xEF\xBB\xBF");

    if ($formType === "professionnel") {
        fputcsv($fp, [
            "Date inscription",
            "Événement",
            "Nom",
            "Prénom",
            "Email",
            "Téléphone",
            "Entreprise"
        ], ";");
    } else {
        fputcsv($fp, [
            "Date inscription",
            "Événement",
            "Nom",
            "Prénom",
            "Email",
            "Téléphone",
            "Adhérent/Partenaire",
            "Nb personnes",
            "Bénévole",
            "Commentaire"
        ], ";");
    }
}

// Écrire la ligne
if ($formType === "professionnel") {
    fputcsv($fp, [
        date("Y-m-d H:i:s"),
        $data["evenement"] ?? "",
        $data["nom"] ?? "",
        $data["prenom"] ?? "",
        $data["email"] ?? "",
        $data["telephone"] ?? "",
        $data["entreprise"] ?? ""
    ], ";");
} else {
    fputcsv($fp, [
        date("Y-m-d H:i:s"),
        $data["evenement"] ?? "",
        $data["nom"] ?? "",
        $data["prenom"] ?? "",
        $data["email"] ?? "",
        $data["telephone"] ?? "",
        $data["adherent"] ?? "",
        $data["nbPersonnes"] ?? "",
        $data["benevole"] ?? "",
        $data["commentaire"] ?? ""
    ], ";");
}

fclose($fp);

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Inscription enregistrée avec succès"
]);
