#!/bin/bash

# 🚀 Snake Arcade Deployment Script
# This script helps you deploy your game to various free hosting platforms

echo "🐍 Snake Arcade Deployment Script"
echo "=================================="

# Check if required files exist
echo "Checking required files..."
if [ ! -f "index.html" ]; then
    echo "❌ Error: index.html not found!"
    exit 1
fi

if [ ! -f "styles.css" ]; then
    echo "❌ Error: styles.css not found!"
    exit 1
fi

if [ ! -f "game.js" ]; then
    echo "❌ Error: game.js not found!"
    exit 1
fi

echo "✅ All required files found!"

# Create deployment directory
echo "Creating deployment directory..."
mkdir -p deploy
cp index.html deploy/
cp styles.css deploy/
cp game.js deploy/
cp manifest.json deploy/
cp sw.js deploy/
cp README.md deploy/
cp demo.html deploy/

echo "✅ Files copied to deploy/ directory"

# GitHub Pages deployment
echo ""
echo "🌐 GitHub Pages Deployment:"
echo "1. Create a new repository on GitHub"
echo "2. Name it: yourusername.github.io"
echo "3. Upload the contents of the 'deploy' folder"
echo "4. Go to Settings > Pages"
echo "5. Select 'main' branch as source"
echo "6. Your game will be available at: https://yourusername.github.io"

# Netlify deployment
echo ""
echo "🚀 Netlify Deployment:"
echo "1. Go to https://netlify.com"
echo "2. Sign up with GitHub"
echo "3. Click 'New site from Git'"
echo "4. Choose your repository"
echo "5. Deploy settings:"
echo "   - Build command: (leave empty)"
echo "   - Publish directory: deploy"
echo "6. Click 'Deploy site'"

# Vercel deployment
echo ""
echo "⚡ Vercel Deployment:"
echo "1. Go to https://vercel.com"
echo "2. Sign up with GitHub"
echo "3. Click 'New Project'"
echo "4. Import your repository"
echo "5. Framework Preset: Other"
echo "6. Root Directory: ./deploy"
echo "7. Click 'Deploy'"

# Firebase deployment
echo ""
echo "🔥 Firebase Deployment:"
echo "1. Install Firebase CLI: npm install -g firebase-tools"
echo "2. Login: firebase login"
echo "3. Initialize: firebase init hosting"
echo "4. Public directory: deploy"
echo "5. Deploy: firebase deploy"

# Surge deployment
echo ""
echo "📈 Surge Deployment:"
echo "1. Install Surge: npm install -g surge"
echo "2. Navigate to deploy directory: cd deploy"
echo "3. Deploy: surge"
echo "4. Choose your domain"

echo ""
echo "🎯 Quick Start Recommendation:"
echo "Start with GitHub Pages (easiest) then move to Netlify for better features!"

echo ""
echo "📚 Next Steps:"
echo "1. Deploy to your chosen platform"
echo "2. Read HOSTING_AND_MONETIZATION.md for monetization strategies"
echo "3. Apply for Google AdSense"
echo "4. Start marketing your game!"

echo ""
echo "✅ Deployment files ready in 'deploy' folder!"
echo "Good luck with your Snake Arcade game! 🎮"
