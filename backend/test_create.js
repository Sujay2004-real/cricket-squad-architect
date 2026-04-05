fetch('http://localhost:3001/api/create-cpu-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: null, teamName: "Test" })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
