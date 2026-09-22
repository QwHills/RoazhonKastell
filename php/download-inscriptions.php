<?php
/**
 * Téléchargement des fichiers d'inscriptions (protégé par mot de passe)
 *
 * Usage :
 *   /api/download-inscriptions.php?key=roazhon2025&event=2-ans-roazhon-kastell
 *   /api/download-inscriptions.php?key=roazhon2025&event=forum-sante-liberale
 *
 * Sans paramètre "event" : liste les fichiers disponibles.
 */

$secretKey = "roazhon2025";

if (($_GET["key"] ?? "") !== $secretKey) {
    http_response_code(403);
    echo "Accès refusé. Ajoutez ?key=roazhon2025 à l'URL.";
    exit;
}

$csvDir = __DIR__ . "/data";
$eventId = $_GET["event"] ?? "";

// Si pas d'eventId, lister les fichiers disponibles
if (empty($eventId)) {
    header("Content-Type: text/html; charset=utf-8");
    echo "<h2>Fichiers d'inscriptions disponibles</h2><ul>";
    $files = glob($csvDir . "/inscriptions-*.csv");
    if (empty($files)) {
        echo "<li>Aucune inscription pour le moment.</li>";
    } else {
        foreach ($files as $file) {
            $name = basename($file, ".csv");
            $id = str_replace("inscriptions-", "", $name);
            $count = max(0, count(file($file)) - 1); // -1 pour l'en-tête
            echo "<li><a href='?key=$secretKey&event=$id'>$name.csv</a> ($count inscriptions)</li>";
        }
    }
    echo "</ul>";
    exit;
}

// Télécharger un fichier spécifique
$eventId = preg_replace('/[^a-z0-9\-]/', '', strtolower($eventId));
$csvFile = $csvDir . "/inscriptions-" . $eventId . ".csv";

if (!file_exists($csvFile)) {
    http_response_code(404);
    echo "Aucune inscription pour cet événement.";
    exit;
}

header("Content-Type: text/csv; charset=utf-8");
header("Content-Disposition: attachment; filename=\"inscriptions-" . $eventId . ".csv\"");
header("Content-Length: " . filesize($csvFile));
readfile($csvFile);
exit;
