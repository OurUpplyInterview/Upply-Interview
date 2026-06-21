cd D:\Graduation_Project\interview_system\static\recruiter-portal
npm run build
cd ..\..
copy static\recruiter-portal\dist\index.html static\recruiter.html
(Get-Content static\recruiter.html) -replace 'src="/assets/', 'src="/recruiter-portal/dist/assets/' | Set-Content static\recruiter.html
Write-Host "Done! recruiter.html is ready."