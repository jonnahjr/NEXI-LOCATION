cd apps
npx -y create-expo-app@latest mobile -t expo-template-blank-typescript --no-install
npx -y create-vite@latest web --template react-ts
npx -y create-vite@latest business-dashboard --template react-ts
npx -y create-vite@latest admin-dashboard --template react-ts
cd ../backend
npx -y @nestjs/cli new api --strict --package-manager npm --skip-git --skip-install
cd ..
