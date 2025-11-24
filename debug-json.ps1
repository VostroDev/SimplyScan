$manager = New-Object -ComObject WIA.DeviceManager
$scanners = @()
if ($manager.DeviceInfos -ne $null) {
    foreach ($info in $manager.DeviceInfos) {
        if ($info.Type -eq 1) {
            $nameProp = $null
            try {
                $nameProp = $info.Properties.Item("Name").Value
            } catch {
                $nameProp = "Unknown Scanner"
            }

            $scanners += @{
                id = $info.DeviceID
                name = $nameProp
            }
        }
    }
}
$scanners | ConvertTo-Json

