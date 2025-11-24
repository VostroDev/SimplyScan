import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'

export interface ScannerDevice {
  id: string
  name: string
}

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
    # Write empty array on error to avoid JSON parse issues
    Write-Output "[]"
}
`

export const listScanners = async (): Promise<ScannerDevice[]> => {
  const tempDir = app.getPath('temp')
  const scriptPath = path.join(tempDir, `list-scanners-${Date.now()}.ps1`)
  
  await fs.promises.writeFile(scriptPath, PS_LIST_SCANNERS)

  return new Promise((resolve) => {
    const powershell = process.env.SystemRoot 
      ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      : 'powershell'

    const ps = spawn(powershell, ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let output = ''
    let error = ''
    
    ps.stdout.on('data', (data) => {
      output += data.toString()
    })

    ps.stderr.on('data', (data) => {
      error += data.toString()
    })

    ps.on('close', async (code) => {
      try {
        await fs.promises.unlink(scriptPath)
      } catch (e) {
        console.error('Failed to cleanup temp script:', e)
      }

      if (code !== 0) {
        console.error('List scanners error code:', code, 'Stderr:', error)
        resolve([])
        return
      }
      try {
        const trimmed = output.trim()
        console.log('WIA Scanner raw output:', trimmed)
        
        if (!trimmed) {
          resolve([])
          return
        }
        const parsed = JSON.parse(trimmed)
        const result = Array.isArray(parsed) ? parsed : [parsed]
        resolve(result.map((r: any) => ({ id: r.id, name: r.name })))
      } catch (e) {
        console.error('Failed to parse scanner list. Raw output:', output, 'Error:', e)
        resolve([])
      }
    })
  })
}

export const scanPage = async (deviceId: string): Promise<string> => {
  const tempDir = path.join(app.getPath('temp'), 'SimplyScan')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const fileName = `scan-${Date.now()}.jpg`
  const outputDetailsPath = path.join(tempDir, fileName)
  const scriptPath = path.join(tempDir, `scan-page-${Date.now()}.ps1`)

  const actualScript = `
$ErrorActionPreference = "Stop"
try {
    $manager = New-Object -ComObject WIA.DeviceManager
    $deviceInfo = $null
    if ($manager.DeviceInfos -eq $null) {
        Write-Error "No devices found"
        exit 1
    }

    foreach ($info in $manager.DeviceInfos) {
        if ($info.DeviceID -eq '${deviceId.replace(/'/g, "''")}') {
            $deviceInfo = $info
            break
        }
    }

    if ($null -eq $deviceInfo) {
        Write-Error "Device not found"
        exit 1
    }

    $device = $deviceInfo.Connect()
    $item = $device.Items.Item(1) 
    $image = $item.Transfer()
    
    $ip = New-Object -ComObject WIA.ImageProcess
    $ip.Filters.Add($ip.FilterInfos.Item("Convert").FilterID)
    $ip.Filters.Item(1).Properties.Item("FormatID").Value = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}" # JPEG
    $image = $ip.Apply($image)

    $outputPath = '${outputDetailsPath.replace(/'/g, "''")}'
    if (Test-Path $outputPath) {
        Remove-Item $outputPath
    }
    
    $image.SaveFile($outputPath)
    Write-Output "Success"
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
  `
  
  await fs.promises.writeFile(scriptPath, actualScript)

  return new Promise((resolve, reject) => {
    const powershell = process.env.SystemRoot 
      ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      : 'powershell'

    const ps = spawn(powershell, ['-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let error = ''
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let stdout = ''

    ps.stdout.on('data', (d) => (stdout += d.toString()))
    ps.stderr.on('data', (d) => (error += d.toString()))

    ps.on('close', async (code) => {
       try {
        await fs.promises.unlink(scriptPath)
      } catch (e) {
        console.error('Failed to cleanup scan script:', e)
      }
      
      if (code !== 0) {
        reject(new Error(`Scan failed: ${error || 'Unknown error'}`))
      } else {
        resolve(outputDetailsPath)
      }
    })
  })
}
