@echo off
echo 🧹 Nettoyage de bolt-export...
rmdir /s /q bolt-export
mkdir bolt-export
mkdir bolt-export\public

echo 📦 Copie du backend...
xcopy app.js bolt-export\ /Y
xcopy server.js bolt-export\ /Y
xcopy package.json bolt-export\ /Y
xcopy .env.example bolt-export\ /Y
xcopy vercel.json bolt-export\ /Y
xcopy config bolt-export\config\ /E /I /Y
xcopy controllers bolt-export\controllers\ /E /I /Y
xcopy middleware bolt-export\middleware\ /E /I /Y
xcopy models bolt-export\models\ /E /I /Y
xcopy routes bolt-export\routes\ /E /I /Y

echo 📦 Copie du frontend React (build)...
xcopy public\dist bolt-export\public\dist\ /E /I /Y

echo ✅ Export terminé ! Tu peux zipper le dossier bolt-export et l'importer dans Bolt.
pause
