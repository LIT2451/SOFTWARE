function install-vpsward {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Token
    )

    Write-Host "=== VPS-WARD Windows Agent Installer ===" -ForegroundColor Cyan

    # Check Admin privileges
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Error "Lỗi: Vui lòng chạy PowerShell với quyền Administrator để cài đặt."
        return
    }

    $serverHost = "litsoftware.io.vn"
    $binaryUrl = "https://$serverHost/collector-windows-amd64.exe"
    $installDir = "$env:ProgramFiles\VPS-WARD"
    $installPath = "$installDir\vpsward-agent.exe"

    # Create directory
    if (-not (Test-Path $installDir)) {
        New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    }

    # Download binary
    Write-Host "Đang tải xuống Agent từ: $binaryUrl..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $binaryUrl -OutFile $installPath -UseBasicParsing

    # Register Task Scheduler to run at startup as SYSTEM
    Write-Host "Đang đăng ký Task Scheduler..." -ForegroundColor Cyan
    $taskName = "VPSWARD-Agent"
    
    # Remove existing task if any
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

    $action = New-ScheduledTaskAction -Execute $installPath -Argument "-server $serverHost -ssl -token $Token"
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Days 365)
    
    # Register the task
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -User "NT AUTHORITY\SYSTEM" -Force | Out-Null

    # Start the task immediately
    Write-Host "Đang khởi chạy Agent..." -ForegroundColor Cyan
    Start-ScheduledTask -TaskName $taskName

    Write-Host "Cài đặt thành công! Dịch vụ VPS-WARD Agent đang chạy ngầm trên Windows." -ForegroundColor Green
    Write-Host "Thiết bị sẽ hiển thị online trên Dashboard trong vài giây." -ForegroundColor Green
}