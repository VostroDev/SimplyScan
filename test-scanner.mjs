import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PS_LIST_SCANNERS = `
$ErrorActionPreference = "Stop"
try {
    $manager = New-Object -ComObject WIA.DeviceManager
    $scanners = @()
    if ($manager.DeviceInfos -ne $null) {
        foreach ($info in $manager.DeviceInfos) {
            if ($info.Type -eq 1) {
                $nameProp = "Unknown"
                try { $nameProp = $info.Properties.Item("Name").Value } catch {}
                $scanners += @{ id = $info.DeviceID; name = $nameProp }
            }
        }
    }
    $scanners | ConvertTo-Json -Depth 2
} catch {
    Write-Error "Error: $($_.Exception.Message)"
}
`;

const scriptPath = path.resolve('temp-scan.ps1');
fs.writeFileSync(scriptPath, PS_LIST_SCANNERS);

console.log("Starting scan via file:", scriptPath);

const ps = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let error = '';

ps.stdout.on('data', (data) => {
    output += data.toString();
});

ps.stderr.on('data', (data) => {
    error += data.toString();
});

ps.on('close', (code) => {
    console.log("Process closed with code:", code);
    console.log("Stdout:", output);
    console.log("Stderr:", error);
    fs.unlinkSync(scriptPath);
});
