document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clusterFilter = document.getElementById('clusterFilter');
    const refreshBtn = document.getElementById('refreshBtn');

    let allData = [];
    let charts = {};

    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error('Failed to fetch data');
            allData = await response.json();
            updateDashboard();
        } catch (error) {
            console.error('Error:', error);
            alert('Error loading data. Make sure model.py has been run.');
        }
    }

    function updateDashboard() {
        const filteredData = filterData();
        updateMetrics(filteredData);
        updateCharts(filteredData);
        updateNewsList(filteredData);
        updateDropdowns();
    }

    function filterData() {
        const searchTerm = searchInput.value.toLowerCase();
        const cluster = clusterFilter.value;

        return allData.filter(item => {
            const matchesSearch = (item.Title + item.Summary).toLowerCase().includes(searchTerm);
            const matchesCluster = cluster === 'all' || item.topic_cluster.toString() === cluster;
            return matchesSearch && matchesCluster;
        });
    }

    function updateMetrics(data) {
        document.getElementById('totalArticles').textContent = data.length;
        document.getElementById('highRiskCount').textContent = data.filter(d => d.impact_level === 'High Risk').length;
        document.getElementById('highOppCount').textContent = data.filter(d => d.impact_level === 'High Opportunity').length;
        document.getElementById('majorEventsCount').textContent = data.filter(d => d.event_flag === 'Major Event').length;
    }

    function updateCharts(data) {
        // Sentiment Distribution
        const sentimentCtx = document.getElementById('sentimentChart').getContext('2d');
        const sentimentCounts = {
            'Positive': data.filter(d => d.sentiment_score > 0.05).length,
            'Neutral': data.filter(d => d.sentiment_score >= -0.05 && d.sentiment_score <= 0.05).length,
            'Negative': data.filter(d => d.sentiment_score < -0.05).length
        };

        if (charts.sentiment) charts.sentiment.destroy();
        charts.sentiment = new Chart(sentimentCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sentimentCounts),
                datasets: [{
                    data: Object.values(sentimentCounts),
                    backgroundColor: ['#10b981', '#94a3b8', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8' } }
                }
            }
        });

        // Impact vs Sentiment Scatter
        const impactCtx = document.getElementById('impactChart').getContext('2d');
        const scatterData = data.map(d => ({
            x: d.sentiment_score,
            y: d.impact_score
        }));

        if (charts.impact) charts.impact.destroy();
        charts.impact = new Chart(impactCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Articles',
                    data: scatterData,
                    backgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Sentiment', color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
                    y: { title: { display: true, text: 'Impact Score', color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    function updateNewsList(data) {
        const list = document.getElementById('newsList');
        list.innerHTML = '';

        data.slice(0, 50).forEach(item => { // Limit to 50 items for performance
            const div = document.createElement('div');
            div.className = 'news-item';

            let tagsHtml = `<span class="tag">Cluster ${item.topic_cluster}</span>`;
            if (item.impact_level.includes('Risk')) tagsHtml += `<span class="tag risk">${item.impact_level}</span>`;
            if (item.impact_level.includes('Opportunity')) tagsHtml += `<span class="tag opportunity">${item.impact_level}</span>`;
            if (item.event_flag !== 'Normal') tagsHtml += `<span class="tag event">${item.event_flag}</span>`;

            div.innerHTML = `
                <div class="news-header">
                    <span>${item.Source}</span>
                    <span>Score: ${item.impact_score.toFixed(1)}</span>
                </div>
                <a href="${item.Link}" target="_blank" class="news-title">${item.Title}</a>
                <div class="tags">${tagsHtml}</div>
            `;
            list.appendChild(div);
        });
    }

    function updateDropdowns() {
        const clusters = [...new Set(allData.map(d => d.topic_cluster))].sort();
        const currentVal = clusterFilter.value;

        // Only repopulate if empty (initial load) to preserve selection
        if (clusterFilter.options.length <= 1) {
            clusters.forEach(c => {
                const option = document.createElement('option');
                option.value = c;
                option.textContent = `Topic ${c}`;
                clusterFilter.appendChild(option);
            });
        }
    }

    searchInput.addEventListener('input', updateDashboard);
    clusterFilter.addEventListener('change', updateDashboard);
    refreshBtn.addEventListener('click', fetchData);

    // Initial load
    fetchData();
});