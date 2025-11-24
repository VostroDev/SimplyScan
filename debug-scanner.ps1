$manager = New-Object -ComObject WIA.DeviceManager
Write-Host "Device Count: $($manager.DeviceInfos.Count)"
foreach ($info in $manager.DeviceInfos) {
    Write-Host "ID: $($info.DeviceID)"
    Write-Host "Name: $($info.Properties.Item("Name").Value)"
    Write-Host "Type: $($info.Type)"
}

