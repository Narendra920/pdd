const fs = require('fs');

function generateHtmlReport(stats, results, outputPath) {
  const passRate = stats.total > 0 ? ((stats.passes / stats.total) * 100).toFixed(1) : 0;
  
  // Aggregate types for chart
  const categories = Object.keys(stats.types);
  const passData = categories.map(c => stats.types[c].passes);
  const failData = categories.map(c => stats.types[c].failures);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mega Web E2E Test Execution Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { background-color: #0d1117; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; }
        h1, h2 { color: #58a6ff; text-align: center; }
        .summary-cards { display: flex; justify-content: space-around; margin: 30px 0; }
        .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; text-align: center; width: 15%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .card h3 { margin: 0 0 10px 0; font-size: 14px; color: #8b949e; }
        .card p { margin: 0; font-size: 28px; font-weight: bold; }
        .pass { color: #238636; }
        .fail { color: #da3633; }
        .total { color: #58a6ff; }
        .rate { color: #a371f7; }
        
        .chart-container { width: 80%; max-width: 800px; margin: 40px auto; background: #161b22; padding: 20px; border-radius: 8px; border: 1px solid #30363d; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 30px; }
        th, td { border: 1px solid #30363d; padding: 10px; text-align: left; font-size: 14px; }
        th { background-color: #21262d; color: #c9d1d9; }
        tr:nth-child(even) { background-color: #161b22; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; color: white; }
        .badge.Passed { background-color: #238636; }
        .badge.Failed { background-color: #da3633; }
        
        .error-msg { color: #ff7b72; font-family: monospace; font-size: 12px; margin-top: 4px;}
    </style>
</head>
<body>
    <h1>🚀 Mega Web E2E Test Execution Report</h1>
    
    <div class="summary-cards">
        <div class="card"><<h3>Total Tests</h3><p class="total">${stats.total}</p></div>
        <div class="card"><<h3>Passed</h3><p class="pass">${stats.passes}</p></div>
        <div class="card"><<h3>Failed</h3><p class="fail">${stats.failures}</p></div>
        <div class="card"><<h3>Pass Rate</h3><p class="rate">${passRate}%</p></div>
        <div class="card"><<h3>Duration (ms)</h3><p>${stats.duration}</p></div>
    </div>

    <div class="chart-container">
        <canvas id="categoryChart"></canvas>
    </div>

    <h2>Test Details</h2>
    <table>
        <thead>
            <tr>
                <th>Category</th>
                <th>Suite</th>
                <th>Test Case</th>
                <th>Duration (ms)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${results.map(r => `
            <tr>
                <td>${r.category}</td>
                <td>${r.suite}</td>
                <td>
                    ${r.title}
                    ${r.error ? `<div class="error-msg">Exception: ${r.error}</div>` : ''}
                </td>
                <td>${r.duration}</td>
                <td><span class="badge ${r.status}">${r.status}</span></td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <script>
        const ctx = document.getElementById('categoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(categories)},
                datasets: [
                    { label: 'Passed', data: ${JSON.stringify(passData)}, backgroundColor: '#238636' },
                    { label: 'Failed', data: ${JSON.stringify(failData)}, backgroundColor: '#da3633' }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true, ticks: { color: '#8b949e' } },
                    y: { stacked: true, ticks: { color: '#8b949e' } }
                },
                plugins: {
                    legend: { labels: { color: '#c9d1d9' } },
                    title: { display: true, text: 'Test Breakdown by Category', color: '#58a6ff' }
                }
            }
        });
    </script>
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, html);
  console.log(`HTML report saved to ${outputPath}`);
}

module.exports = { generateHtmlReport };
