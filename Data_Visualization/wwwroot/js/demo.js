const worldTotalAPI = 'https://api.covid19api.com/world/total';
const countryAPI = 'https://api.covid19api.com/summary';
const allTimesAPI = 'https://api.covid19api.com/world';
// fetch data
async function loadData(url) {
    const response = await fetch(url)
    return response.json();
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
async function renderWorldTotal() {
    const rowInfor = document.getElementById('rowInfor');
    let htmls = '';
    const COLORS = ['red', 'green', 'gray'];
    const STATUS = ['CONFIRMED', 'RECOVERED', 'DEATHS']
    try {
        const data = await loadData(worldTotalAPI);
        const newData = Object.values(data);
        newData.forEach((element, index) => {
            htmls += `
            <div class="col" >
            <div class="card">
                <div class="card-body">
                 <h3 style="color: ${COLORS[index]};">${numberWithCommas(element)}</h3>
                 <h4>${STATUS[index]}</h4>
                </div>
            </div>
        </div>
        `;
        })
        rowInfor.innerHTML = htmls;
    } catch (err) {
        console.log(err);
    }
}

function barchart(labels, data, ctx) {
    const dataInfor = {
        labels: labels,
        datasets: [{
            label: 'Numbers of case',
            data: data,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
        }]
    };
    const config = {
        type: 'bar',
        data: dataInfor,
        options: {
            indexAxis: 'y',
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        },
    };
    const barChart = new Chart(ctx, config);
}

function doughnutChart(labels, data, ctx) {
    const dataInfor = {
        labels: labels,
        datasets: [{
            label: 'dought',
            data: data,
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgba(153, 102, 255)',
                'rgb(255, 205, 86)',
                'rgba(255, 159, 64)',
                'rgba(75, 192, 192)',
                'rgb(54, 162, 235)', ,
            ],
            hoverOffset: 6
        }]
    };

    const options = {
        tooltips: {
            enabled: false
        },
        plugins: {
            datalabels: {
                formatter: (value, ctx) => {
                    let sum = 0;
                    let dataArr = ctx.chart.data.datasets[0].data;
                    dataArr.map(data => {
                        sum += data;
                    });
                    let percentage = (value * 100 / sum).toFixed(2) + "%";
                    return percentage;
                },
                color: '#fff',
            }
        }
    };

    const config = {
        type: 'doughnut',
        data: dataInfor,
        plugins: [ChartDataLabels],
        options: options,
    };

    const doughnutChart = new Chart(ctx, config);
}
//Line chart
function lineChart(labels, data) {
    const dataInfor = {
        labels: labels,
        datasets: [{
            label: 'Confirmed',
            data: data.confirmed,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        },
        {
            label: 'Recovered',
            data: data.recovered,
            fill: false,
            borderColor: 'rgba(255, 159, 64)',
            tension: 0.1
        },
        {
            label: 'Deaths',
            data: data.deaths,
            fill: false,
            borderColor: 'rgba(153, 102, 255)',
            tension: 0.1
        }
        ]
    };
    const config = {
        type: 'line',
        data: dataInfor,
        options: {
            scales: {
                x: {
                    ticks: {
                        display: false
                    }
                }
            }
        }
    };
    const ctx = document.getElementById('lineChart').getContext('2d');
    const lineChart = new Chart(ctx, config);
}
renderWorldData = (world_data, status) => {
    let res = []
    world_data.forEach(e => {
        switch (status) {
            case 'confirmed':
                res.push(e.TotalConfirmed)
                break
            case 'recovered':
                res.push(e.TotalRecovered)
                break
            case 'deaths':
                res.push(e.TotalDeaths)
                break
        }
    })
    return res
}
//Function sort data summary
async function sortDataSummary() {
    try {
        const summaryAPI = await loadData(countryAPI);
        const casesByCountries = summaryAPI.Countries.map(country => {
            return {
                'Country': country.Country,
                'TotalConfirmed': country.TotalConfirmed
            }
        })
        //Sort total confirmed case
        return casesByCountries.sort((a, b) => b.TotalConfirmed - a.TotalConfirmed)

    } catch (err) {
        console.log(err);
    }
}
//function render bar chart
async function renderBarChart() {
    const ctx = document.getElementById('barChart').getContext('2d');
    let countries = [];
    let totalCaseConfirmed = [];
    const casesByCountries = await sortDataSummary();
    for (let i = 0; i < 10; i++) {
        countries.push(casesByCountries[i].Country);
        totalCaseConfirmed.push(casesByCountries[i].TotalConfirmed);
    }
    //render bar chart
    barchart(countries, totalCaseConfirmed, ctx);
}
//function render doughnut chart
async function renderDoughnut() {
    const ctx = document.getElementById('doughnutChart').getContext('2d');
    let countries = [];
    let totalCaseConfirmed = [];
    const casesByCountries = await sortDataSummary();
    //Sum of cases
    let otherCase = casesByCountries.reduce((total, country,) => {
        return total + country.TotalConfirmed;
    }, 0)
    // take 5 countries highest of case
    for (let i = 0; i < 5; i++) {
        countries.push(casesByCountries[i].Country);
        totalCaseConfirmed.push(casesByCountries[i].TotalConfirmed);
        otherCase -= casesByCountries[i].TotalConfirmed;
    }
    countries.push('Other');
    totalCaseConfirmed.push(otherCase);
    //render doughnut chart
    doughnutChart(countries, totalCaseConfirmed, ctx);
}
//render line chart
async function renderLineChart() {
    let labels = [];
    let confirm_data, recovered_data, deaths_data;
    try {
        let world_data = await loadData(allTimesAPI);

        world_data.sort((a, b) => new Date(a.Date) - new Date(b.Date))

        world_data.forEach(e => {
            let d = new Date(e.Date)
            labels.push(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
        })

        confirm_data = renderWorldData(world_data, 'confirmed');
        recovered_data = renderWorldData(world_data, 'recovered');
        deaths_data = renderWorldData(world_data, 'deaths');
        let series = {
            'confirmed': confirm_data,
            'recovered': recovered_data,
            'deaths': deaths_data
        };
        lineChart(labels, series);
    } catch (err) {
        console.log(err)
    }
}
renderBarChart();
renderWorldTotal();
renderDoughnut();
renderLineChart();