$d = 'C:\Users\ryan.pattison\Documents\LocalLLM'
$p = Start-Process -FilePath "$d\llama\llama-server.exe" -ArgumentList @('-m',"$d\models\Qwen3-4B-abliterated.Q4_K_M.gguf",'-t','4','-c','8192','-b','256','-ngl','0','--mlock','--jinja','--host','127.0.0.1','--port','8080','--reasoning-budget','0') -RedirectStandardError "$d\srv.err" -RedirectStandardOutput "$d\srv.out" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 25
if ($p.HasExited) { 'EXITED code ' + $p.ExitCode } else { 'still running pid ' + $p.Id; Stop-Process -Id $p.Id -Force }
Get-Content "$d\srv.err" -Tail 25
