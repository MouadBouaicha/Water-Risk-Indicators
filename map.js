
const width = 700;
const height = 400;
const margin = { top: 15, right: 15, bottom: 15, left: 15 };
const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

let currentCountry = 'fra';
let currentDataType = 'annual';
let selectedBasins = new Set();
let currentZoom = 1;
let geoData = null;  

const bounds = d3.geoBounds(geoData);
const center = d3.geoCentroid(geoData);
console.log(`${currentCountry} complete bounds:`, {
    x0: bounds[0][0],
    y0: bounds[0][1],
    x1: bounds[1][0],
    y1: bounds[1][1],
    width: bounds[1][0] - bounds[0][0],
    height: bounds[1][1] - bounds[0][1]
});

let xScale, yScale, xAxis, yAxis;
const chartWidth = 400;
const chartHeight = 400;
const chartMargin = { top: 30, right: 20, bottom: 40, left: 40 };

    // Base Water Risk Indicators
    const indices = {
        bws: {
            name: "Water Stress (BWS)",
            description: "Measures the ratio of total water withdrawals to available renewable water supplies.",
            getColumn: (dataType, period) => {
                if (dataType === 'future') return `${period.scenario}${period.year}_ws_x_r`;
                return dataType === 'monthly' ? `bws_${String(period).padStart(2, '0')}_raw` : 'bw _raw';  // Fixed property name
            },
            getCategoryColumn: (dataType, period) => {
                if (dataType === 'future') return `${period.scenario}${period.year}_ws_x_c`;
                return 'bws_cat';
            },
            getLabelColumn: (dataType, period) => {
                if (dataType === 'future') return `${period.scenario}${period.year}_ws_x_l`;
                return 'bws_label';
            },
            colorScale: d3.scaleThreshold()
                .domain([0.1, 0.2, 0.4, 0.8])
                .range(['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'])
        },
        
        bwd: {
            name: "Water Depletion (BWD)",
            description: "Measures the ratio of water consumption to available renewable water supplies.",
            getColumn: (dataType, period) => {
                if (dataType === 'future') return `${period.scenario}${period.year}_wd_x_r`;
                return dataType === 'monthly' ? `bwd_${String(period).padStart(2, '0')}_raw` : 'bwd_raw';
            },
            colorScale: d3.scaleThreshold()
                .domain([0.05, 0.15, 0.3, 0.5])
                .range(['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177'])
        },
        iav: {
            name: "Interannual Variability (IAV)",
            description: "Measures variations in water supply between years.",
            getColumn: (dataType, period) => {
                if (dataType === 'future') return `${period.scenario}${period.year}_iv_x_r`;
                return dataType === 'monthly' ? `iav_${String(period).padStart(2, '0')}_raw` : 'iav_raw';
            },
            colorScale: d3.scaleThreshold()
                .domain([0.25, 0.5, 0.75, 1.0])
                .range(['#edf8fb', '#b3cde3', '#8c96c6', '#88419d', '#4d004b'])
        },

         // For future projections
    ws: {
        name: "Future Water Stress",
        description: "Projected water stress levels under different scenarios.",
        getColumn: (dataType, period) => `${period.scenario}${period.year}_ws_x_r`,
        getCategoryColumn: (dataType, period) => `${period.scenario}${period.year}_ws_x_c`,
        getLabelColumn: (dataType, period) => `${period.scenario}${period.year}_ws_x_l`,
        colorScale: d3.scaleThreshold()
            .domain([0.1, 0.2, 0.4, 0.8])
            .range(['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'])
    },

    wd: {
        name: "Future Water Depletion",
        description: "Projected water depletion under different scenarios.",
        getColumn: (dataType, period) => `${period.scenario}${period.year}_wd_x_r`,
        getCategoryColumn: (dataType, period) => `${period.scenario}${period.year}_wd_x_c`,
        getLabelColumn: (dataType, period) => `${period.scenario}${period.year}_wd_x_l`,
        colorScale: d3.scaleThreshold()
            .domain([0.05, 0.15, 0.3, 0.5])
            .range(['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177'])
    },

    iv: {
        name: "Future Interannual Variability",
        description: "Projected interannual variability under different scenarios.",
        getColumn: (dataType, period) => `${period.scenario}${period.year}_iv_x_r`,
        getCategoryColumn: (dataType, period) => `${period.scenario}${period.year}_iv_x_c`,
        getLabelColumn: (dataType, period) => `${period.scenario}${period.year}_iv_x_l`,
        colorScale: d3.scaleThreshold()
            .domain([0.25, 0.5, 0.75, 1.0])
            .range(['#edf8fb', '#b3cde3', '#8c96c6', '#88419d', '#4d004b'])
    },


    sev: {
        name: "Seasonal Variability (SEV)",
        description: "Measures variations in water supply between months of the year.",
        getColumn: (dataType, period) => {
            if (dataType === 'future') return `${period.scenario}${period.year}_sv_x_r`;
            return 'sev_raw';
        },
        getCategoryColumn: (dataType, period) => {
            if (dataType === 'future') return `${period.scenario}${period.year}_sv_x_c`;
            return 'sev_cat';
        },
        getLabelColumn: (dataType, period) => {
            if (dataType === 'future') return `${period.scenario}${period.year}_sv_x_l`;
            return 'sev_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([0.33, 0.66, 1, 1.33])
            .range(['#f7fcf5', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac'])
    },

    gtd: {
        name: "Groundwater Table Decline (GTD)",
        description: "Measures the rate of groundwater table decline.",
        getColumn: (dataType, period) => {
            return 'gtd_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'gtd_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'gtd_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([-0.05, -0.02, -0.005, 0])
            .range(['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'])
    },

    rfr: {
        name: "Riverine Flood Risk (RFR)",
        description: "Measures the risk of riverine flooding.",
        getColumn: (dataType, period) => {
            return 'rfr_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'rfr_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'rfr_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([0.002, 0.005, 0.01, 0.02])
            .range(['#f7fbff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'])
    },

    drr: {
        name: "Drought Risk (DRR)",
        description: "Measures the risk of drought conditions.",
        getColumn: (dataType, period) => {
            return 'drr_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'drr_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'drr_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([0.2, 0.4, 0.6, 0.8])
            .range(['#fff7ec', '#fee8c8', '#fdd49e', '#fc8d59', '#d7301f'])
    },

    ucw: {
        name: "Untreated Connected Wastewater",
        description: "Measures the percentage of wastewater that goes untreated.",
        getColumn: (dataType, period) => {
            return 'ucw_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'ucw_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'ucw_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([10, 30, 50, 70])
            .range(['#edf8fb', '#b3cde3', '#8c96c6', '#88419d', '#4d004b'])
    },

    cep: {
        name: "Coastal Eutrophication Potential",
        description: "Measures the potential for coastal eutrophication.",
        getColumn: (dataType, period) => {
            return 'cep_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'cep_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'cep_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([1, 2, 5, 10])
            .range(['#f7fcf5', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac'])
    },

    rri: {
        name: "RepRisk Index",
        description: "Measures reputational risk exposure to ESG issues.",
        getColumn: (dataType, period) => {
            return 'rri_raw';
        },
        getCategoryColumn: (dataType, period) => {
            return 'rri_cat';
        },
        getLabelColumn: (dataType, period) => {
            return 'rri_label';
        },
        colorScale: d3.scaleThreshold()
            .domain([25, 50, 75, 100])
            .range(['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'])
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize map first
    const mapElements = initializeMap();
    svg = mapElements.svg;
    g = mapElements.g;
    mapGroup = mapElements.mapGroup;
    projection = mapElements.projection;
    path = mapElements.path;
    zoom = mapElements.zoom;

    // Add this code here to handle initial state
    if (currentDataType === 'annual') {
        const indexSelector = document.getElementById('index-selector');
        indexSelector.style.display = 'none';
    }

    // Then initialize controls
    initializeControls();
    initializeZoomControls();
    
    // Finally load the data
    loadInitialData();
});

// Add after your other event listeners
// Add this to your map.js file
// Dans votre event listener pour data-type-selector
document.getElementById('data-type-selector').addEventListener('change', function(e) {
    currentDataType = e.target.value;
    
    // Show/hide controls based on data type
    const sliderContainer = document.querySelector('.slider-container');
    const futureControls = document.querySelector('.future-controls');
    const indexSelector = document.getElementById('index-selector');
    
    if (currentDataType === 'annual') {
        // Hide the index selector completely for annual data
        indexSelector.style.display = 'none';
        sliderContainer.style.display = 'none';
        futureControls.style.display = 'none';
    } else if (currentDataType === 'monthly') {
        indexSelector.style.display = 'block';
        sliderContainer.style.display = 'flex';
        futureControls.style.display = 'none';
        // Show only monthly options
        Array.from(indexSelector.getElementsByTagName('optgroup')).forEach(group => {
            group.style.display = group.classList.contains('monthly-options') ? 'block' : 'none';
        });
    } else { // future
        indexSelector.style.display = 'block';
        sliderContainer.style.display = 'none';
        futureControls.style.display = 'flex';
        // Show only future options
        Array.from(indexSelector.getElementsByTagName('optgroup')).forEach(group => {
            group.style.display = group.classList.contains('future-options') ? 'block' : 'none';
        });
    }
    
    // Reset selection and update visualizations
    selectedBasins.clear();
    clearCharts();
    loadInitialData();
});

// Keep this part
document.getElementById('country-selector').addEventListener('change', function() {
    currentCountry = this.value;
    selectedBasins.clear();
    clearCharts();
    loadInitialData();
});
// Add CSS for country selector
const style = document.createElement('style');
style.textContent = `
.country-selector {
    min-width: 150px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    margin-right: 20px;
}
`;
document.head.appendChild(style);

// Current country state









// Créer la tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



    // Initialize the map elements
function initializeMap() {
    // Initialize projection
    projection = d3.geoMercator();
    path = d3.geoPath().projection(projection);
    
    // Initialize zoom behavior
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);
    
    // Initialize SVG elements
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);
    
    // Add clip path
    svg.append("defs")
        .append("clipPath")
        .attr("id", "map-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
    
    // Initialize map groups
    mapGroup = svg.append("g")
        .attr("clip-path", "url(#map-clip)");
    
    g = mapGroup.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, g, mapGroup, projection, path, zoom };
}

    


    

    

    
    // Initialize chart SVG
    const chartSvg = d3.select("#basin-chart")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);
    
    const chartG = chartSvg.append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);
    


// Initialize scales
xScale = d3.scalePoint()
    .range([0, chartWidth - chartMargin.left - chartMargin.right]);

yScale = d3.scaleLinear()
    .range([chartHeight - chartMargin.top - chartMargin.bottom, 0]);

// Initialize axes
xAxis = chartG.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight - chartMargin.top - chartMargin.bottom})`);

yAxis = chartG.append("g")
    .attr("class", "y-axis");


    async function loadInitialData() {
        try {
            const response = await fetch(`processed_data/${currentCountry}/${currentCountry}_${currentDataType}.geojson`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            geoData = await response.json();
            
            if (geoData) {
                projection = d3.geoMercator();
                
                switch(currentCountry) {
                    case 'fra':
                        projection
                            .center([2.2, 46.8])
                            .scale(2200)
                            .translate([width / 2, height / 2]);
                        break;
                    case 'esp':
                        projection
                            .center([-3.5, 40.2])
                            .scale(2800)
                            .translate([width / 2, height / 2]);
                        break;
                    case 'deu':
                        projection
                            .center([10, 51])
                            .scale(3000)
                            .translate([width / 2, height / 2]);
                        break;
                    case 'mar':
                        projection
                            .center([-8, 28])
                            .scale(1500)
                            .translate([width / 2, height / 2]);
                        break;
                }
    
                path = d3.geoPath().projection(projection);
    
                const initialIndex = indexSelector.value;
                indexInfo.textContent = indices[initialIndex].description;
                updateMap(1, initialIndex);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    }

    function updateVisualization() {
        if (!geoData) return;
    
        // Clear existing elements
        g.selectAll("*").remove();
        
        const validFeatures = geoData.features.filter(f => 
            f.properties.PFAF_ID !== '231110' && 
            f.properties.PFAF_ID !== '216042' &&
            (f.properties.GID_0 === 'MAR' || f.properties.GID_0 === 'ESH')  // Accept both Morocco and Western Sahara
        );
    
        // Use the country-specific projection settings
        switch(currentCountry) {
            case 'fra':
                projection
                    .center([2.5, 46.5])
                    .scale(3000);
                break;
            case 'esp':
                projection
                    .center([-3.5, 40.2])
                    .scale(2800);
                break;
            case 'deu':
                projection
                    .center([10, 51])
                    .scale(3000);
                break;
            case 'mar':
                projection
                    .center([-6, 29])  // Adjusted center to include both regions
                    .scale(1800);      // Adjusted scale to show full territory
                break;
        }
        projection.translate([width / 2, height / 2]);
        path = d3.geoPath().projection(projection);
        // Create the features
        g.selectAll("path")
            .data(validFeatures)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", d => {
                const indexKey = indexSelector.value;
                const valueColumn = indices[indexKey].getColumn(currentDataType, 
                    currentDataType === 'future' ? 
                        { scenario: document.getElementById('scenario-selector').value,
                          year: document.getElementById('year-selector').value } : 
                        parseInt(document.getElementById("month-slider").value)
                );
                const value = d.properties[valueColumn];
                return value ? indices[indexKey].colorScale(value) : "#ccc";
            })
            .attr("stroke", "white")
            .attr("stroke-width", `${0.5/currentZoom}px`)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", function(event, d) {
                const basinId = d.properties.HYBAS_ID;
                
                if (selectedBasins.has(basinId)) {
                    selectedBasins.delete(basinId);
                } else {
                    selectedBasins.add(basinId);
                }
                
                updateBasinStyles();
                
                if (selectedBasins.size > 0) {
                    const selectedBasinsData = Array.from(selectedBasins).map(id => 
                        geoData.features.find(f => f.properties.HYBAS_ID === id).properties
                    );
                    if (currentDataType === 'annual') {
                        updateRadarChart(selectedBasinsData);
                    } else {
                        updateChartMultiple(selectedBasinsData, indexSelector.value);
                        updateNetworkGraphMultiple(selectedBasinsData, parseInt(slider.value), indexSelector.value);
                    }
                } else {
                    clearCharts();
                }
            });
    
        const initialIndex = indexSelector.value;
        indexInfo.textContent = indices[initialIndex].description;
        updateLegend(initialIndex);  // Update the legend
    }

// Helper function to round coordinates
function roundCoordinates(coords) {
    if (Array.isArray(coords[0])) {
        return coords.map(roundCoordinates);
    }
    return [
        Math.round(coords[0] * 10000) / 10000,
        Math.round(coords[1] * 10000) / 10000
    ];
}

function updateVisualizations(indexKey) {
    const currentMonth = parseInt(document.getElementById("month-slider").value);
    
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );
        updateChartMultiple(selectedBasinsData, indexKey);
        updateNetworkGraphMultiple(selectedBasinsData, currentMonth, indexKey);
    } else {
        clearCharts();
    }
}


// Fonction pour initialiser les échelles du graphique
function initializeScales() {
    const xScale = d3.scalePoint()
        .range([0, chartWidth - chartMargin.left - chartMargin.right]);

    const yScale = d3.scaleLinear()
        .range([chartHeight - chartMargin.top - chartMargin.bottom, 0]);

    return { xScale, yScale };
}

// Fonction pour initialiser les axes
function initializeAxes(chartG, height, margin) {
    const xAxis = chartG.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height - margin.top - margin.bottom})`);

    const yAxis = chartG.append("g")
        .attr("class", "y-axis");

    return { xAxis, yAxis };
}

// Fonction pour gérer le zoom
function zoomed(event) {
    currentZoom = event.transform.k;
    mapGroup.attr("transform", event.transform);
    g.selectAll("path")
        .style("stroke-width", `${0.5/event.transform.k}px`);
}

// Fonction pour mettre à jour les styles des bassins
function updateBasinStyles() {
    g.selectAll("path")
        .style("stroke", d => selectedBasins.has(d.properties.HYBAS_ID) ? "#ff0000" : "white")
        .style("stroke-width", d => selectedBasins.has(d.properties.HYBAS_ID) ? "2px" : "0.5px")
        .style("stroke-dasharray", d => selectedBasins.has(d.properties.HYBAS_ID) ? "4" : "none");
}

function clearCharts() {
    chartG.selectAll("path").remove();
    chartSvg.selectAll(".basin-legend").remove();
    d3.select("#network-graph").selectAll("*").remove();
}

// Initialize controls
const slider = document.getElementById("month-slider");
const monthDisplay = document.getElementById("month-display");
const indexSelector = document.getElementById("index-selector");
const indexInfo = document.getElementById("index-info");

slider.addEventListener("input", function() {
    const month = parseInt(this.value);
    monthDisplay.textContent = months[month - 1];
    updateMap(month, indexSelector.value);
});

indexSelector.addEventListener("change", function() {
    const indexConfig = indices[this.value];
    indexInfo.textContent = indexConfig.description;
    updateMap(parseInt(slider.value), this.value);
});




// Fonction pour mettre à jour la légende
function updateLegend(indexKey) {
    const indexConfig = indices[indexKey];
    
    // Clear existing legend
    d3.select("#legend").selectAll("*").remove();
    
    const legendWidth = 400;
    const legendHeight = 60;
    const margin = { top: 10, right: 20, bottom: 25, left: 20 };

    const legend = d3.select("#legend")
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    // Create scale for legend
    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(indexConfig.colorScale.domain())])
        .range([0, legendWidth - margin.left - margin.right]);

    // Add color rectangles
    const boxWidth = (legendWidth - margin.left - margin.right) / indexConfig.colorScale.range().length;
    
    indexConfig.colorScale.range().forEach((color, i) => {
        legend.append("rect")
            .attr("x", margin.left + (i * boxWidth))
            .attr("y", margin.top)
            .attr("width", boxWidth)
            .attr("height", 20)
            .style("fill", color);
    });

    // Add axis
    const axis = d3.axisBottom(legendScale)
        .tickValues([0, ...indexConfig.colorScale.domain()])
        .tickFormat(d => d.toFixed(2));

    legend.append("g")
        .attr("transform", `translate(${margin.left},${margin.top + 20})`)
        .call(axis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "12px");

    // Add title
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", legendHeight - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(indexConfig.name);
}

function updateMap(month, indexKey) {
    if (!geoData) return;

    const indexConfig = indices[indexKey];
    const valueColumn = indexConfig.getColumn(currentDataType, 
        currentDataType === 'future' ? 
            { scenario: document.getElementById('scenario-selector').value,
              year: document.getElementById('year-selector').value } : 
            month
    );

    // Filter out background "basins"
    const validFeatures = geoData.features.filter(f => 
        f.properties.PFAF_ID !== '231110' && f.properties.PFAF_ID !== '216042'
    );

    const paths = g.selectAll("path")
        .data(validFeatures)
        .join("path")
        .attr("d", path)
        .attr("fill", d => {
            const value = d.properties[valueColumn];
            return value ? indexConfig.colorScale(value) : "#ccc";
        })
        .attr("stroke", "white")
        .attr("stroke-width", `${0.5/currentZoom}px`)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
       // In updateMap function, modify the click handler:
// In updateMap function, modify the click handler
.on("click", function(event, d) {
    const basinId = d.properties.HYBAS_ID;
    
    if (selectedBasins.has(basinId)) {
        selectedBasins.delete(basinId);
    } else {
        selectedBasins.add(basinId);
    }
    
    updateBasinStyles();
    
    // Clear existing charts
    d3.select("#basin-chart").selectAll("*").remove();
    
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );
        
        if (currentDataType === 'annual') {
            // For annual data, show radar chart
            chartG.selectAll("*").remove();  // Clear line chart elements
            updateRadarChart(selectedBasinsData);
        } else {
            // For monthly or future data, show line chart
            updateChartMultiple(selectedBasinsData, indexSelector.value);
            if(currentDataType === 'monthly') {
                updateNetworkGraphMultiple(selectedBasinsData, parseInt(slider.value), indexSelector.value);
            }
        }
    } else {
        clearCharts();
    }
});

    updateBasinStyles();
    updateLegend(indexKey);

}
// Fonction pour ajouter les interactions à la carte
function addMapInteractions(paths, valueColumn, categoryColumn, labelColumn, indexKey) {
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    paths
        .on("mouseover", function(event, d) {
            const isSelected = selectedBasins.has(d.properties.HYBAS_ID);
            d3.select(this)
                .style("stroke", isSelected ? "#ff6666" : "#666")
                .style("stroke-width", "2px");

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);

            tooltip.html(`
                <strong>ID du bassin:</strong> ${d.properties.PFAF_ID}<br/>
                <strong>Valeur:</strong> ${d.properties[valueColumn]}<br/>
                <strong>Catégorie:</strong> ${d.properties[categoryColumn]}<br/>
                <strong>Label:</strong> ${d.properties[labelColumn]}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", `${0.5/currentZoom}px`);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            updateBasinStyles();
        })
        .on("click", handleBasinClick);
}

// Fonction pour gérer le clic sur un bassin
function handleBasinClick(event, d) {
    const basinId = d.properties.HYBAS_ID;
    
    if (selectedBasins.has(basinId)) {
        selectedBasins.delete(basinId);
    } else {
        selectedBasins.add(basinId);
    }
    
    updateBasinStyles();
    
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );
        updateChartMultiple(selectedBasinsData, indexSelector.value);
        updateNetworkGraphMultiple(selectedBasinsData, parseInt(slider.value), indexSelector.value);
    } else {
        clearCharts();
    }
}

function updateChartMultiple(basinsData, indexKey) {
    console.log("Starting updateChartMultiple with data:", basinsData, "and index:", indexKey);

    if (!basinsData || !basinsData.length) {
        console.log("No basin data provided");
        return;
    }

    // Clear existing chart
    d3.select("#basin-chart").selectAll("*").remove();

    // Initialize new SVG
    const chartSvg = d3.select("#basin-chart")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    const chartG = chartSvg.append("g")
        .attr("transform", `translate(${chartMargin.left},${chartMargin.top})`);

    // Create data for line chart
    const chartData = months.map((month, i) => {
        const monthStr = (i + 1).toString().padStart(2, '0');
        const monthData = { month: month };
        
        basinsData.forEach(basinData => {
            const valueColumn = indices[indexKey].getColumn('monthly', monthStr);
            monthData[`value_${basinData.HYBAS_ID}`] = basinData[valueColumn] || 0;
        });
        
        return monthData;
    });

    console.log("Chart data created:", chartData);

    // Create scales
    const xScale = d3.scalePoint()
        .range([0, chartWidth - chartMargin.left - chartMargin.right])
        .domain(months);

    const yScale = d3.scaleLinear()
        .range([chartHeight - chartMargin.top - chartMargin.bottom, 0])
        .domain([0, d3.max(chartData, d => 
            d3.max(basinsData.map(basin => d[`value_${basin.HYBAS_ID}`]))
        ) * 1.1]);

    // Add axes
    chartG.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight - chartMargin.top - chartMargin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    chartG.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Draw lines
    basinsData.forEach((basinData, index) => {
        const line = d3.line()
            .x(d => xScale(d.month))
            .y(d => yScale(d[`value_${basinData.HYBAS_ID}`]));

        chartG.append("path")
            .datum(chartData)
            .attr("class", `line-${basinData.HYBAS_ID}`)
            .attr("d", line)
            .style("fill", "none")
            .style("stroke", d3.schemeCategory10[index])
            .style("stroke-width", 2);

        // Add legend
        const basinLabel = basinData.Name || `Basin ${basinData.PFAF_ID}`;
        chartG.append("text")
            .attr("x", 50 + index * 120)  // Augmenté l'espacement pour les noms plus longs
            .attr("y", 20)
            .style("fill", d3.schemeCategory10[index])
            .style("font-size", "12px")
            .text(basinLabel);
    });
}
// Fonction pour mettre à jour le graphe réseau
function updateNetworkGraphMultiple(selectedBasins, month, indexKey) {
    const networkWidth = document.getElementById('network-graph').clientWidth;
    const networkHeight = 300;
    
    // Clear existing graph
    d3.select("#network-graph").selectAll("*").remove();
    
    // Create new SVG
    const networkSvg = d3.select("#network-graph")
        .append("svg")
        .attr("width", networkWidth)
        .attr("height", networkHeight);

    // Prepare network data
    const nodes = [];
    const links = [];
    const addedNodes = new Set();

    // Add each selected basin to network
    selectedBasins.forEach(basin => {
        addBasinToNetwork(basin, nodes, links, addedNodes, 0, month, indexKey);
    });

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(80))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(networkWidth / 2, networkHeight / 2));

    // Create links
    const link = networkSvg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", "#999")
        .style("stroke-opacity", 0.6)
        .style("stroke-width", 1);

    // Create nodes
    const node = networkSvg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => Math.sqrt(d.area) / 40 + 5)
        .style("fill", d => indices[indexKey].colorScale(d.value))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .call(drag(simulation));

    // Add labels
    const labels = networkSvg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.pfafId)
        .attr("font-size", "10px")
        .attr("dx", 12)
        .attr("dy", 4);

    // Update positions on simulation tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        labels
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });
}

// Fonction pour préparer les données du graphique
function prepareChartData(basinsData, indexConfig) {
    return months.map((month, i) => {
        const monthStr = (i + 1).toString().padStart(2, '0');
        const monthData = { month: month };
        
        basinsData.forEach(basinData => {
            monthData[`value_${basinData.HYBAS_ID}`] = basinData[indexConfig.getColumn(monthStr)];
        });
        
        return monthData;
    });
}

// Fonction pour mettre à jour les échelles et les axes
function updateScalesAndAxes(chartData, basinsData) {
    xScale.domain(months);
    const maxValue = d3.max(chartData, d => 
        d3.max(basinsData.map(basin => d[`value_${basin.HYBAS_ID}`]))
    );
    yScale.domain([0, maxValue * 1.1]);

    xAxis.call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    yAxis.call(d3.axisLeft(yScale));
}

// Fonction pour dessiner les lignes du graphique
function drawLines(chartData, basinsData) {
    basinsData.forEach((basinData, index) => {
        const line = d3.line()
            .x(d => xScale(d.month))
            .y(d => yScale(d[`value_${basinData.HYBAS_ID}`]));

        const lineId = `line-${basinData.HYBAS_ID}`;
        
        const path = chartG.selectAll(`#${lineId}`)
            .data([chartData]);

        path.enter()
            .append("path")
            .attr("id", lineId)
            .merge(path)
            .transition()
            .duration(300)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", d3.schemeCategory10[index % 10])
            .attr("stroke-width", 2);

        updateChartLegend(basinData, index);
    });

    removeUnselectedBasins();
}


function updateChartLegend(basinData, index) {
    const legend = chartSvg.selectAll(`#legend-${basinData.HYBAS_ID}`)
        .data([basinData]);

    legend.enter()
        .append("text")
        .attr("id", `legend-${basinData.HYBAS_ID}`)
        .attr("x", 50 + index * 100)
        .attr("y", 20)
        .style("fill", d3.schemeCategory10[index % 10])
        .text(`Bassin: ${basinData.PFAF_ID}`);
}


// Fonction pour supprimer les bassins non sélectionnés
function removeUnselectedBasins() {
    chartG.selectAll("path")
        .filter(function() {
            const id = this.id.replace("line-", "");
            return !selectedBasins.has(Number(id));
        })
        .remove();

    chartSvg.selectAll("text")
        .filter(function() {
            const id = this.id?.replace("legend-", "");
            return id && !selectedBasins.has(Number(id));
        })
        .remove();
}



// Fonction pour ajouter un bassin au réseau
function addBasinToNetwork(basin, nodes, links, addedNodes, depth, month, indexKey) {
    if (depth > 2) return;
    
    const basinId = basin.HYBAS_ID;
    if (!addedNodes.has(basinId)) {
        addedNodes.add(basinId);
        nodes.push({
            id: basinId,
            pfafId: basin.PFAF_ID,
            area: basin.UP_AREA,
            value: basin[indices[indexKey].getColumn(currentDataType, month)]
        });

        // Find connected basins
        const nextDownId = basin.NEXT_DOWN;
        if (nextDownId) {
            const nextDown = geoData.features.find(f => 
                f.properties.HYBAS_ID === nextDownId
            )?.properties;

            if (nextDown) {
                if (!addedNodes.has(nextDown.HYBAS_ID)) {
                    addBasinToNetwork(nextDown, nodes, links, addedNodes, depth + 1, month, indexKey);
                }
                // Only add link if both source and target nodes exist
                const targetExists = nodes.some(n => n.id === nextDown.HYBAS_ID);
                if (targetExists) {
                    links.push({
                        source: basinId,
                        target: nextDown.HYBAS_ID
                    });
                }
            }
        }
    }
}

// Fonction pour créer la simulation du réseau
// Fonction pour créer la simulation du réseau
function createNetworkSimulation(nodes, links, networkSvg, networkWidth, networkHeight, indexKey) {
    // Augmenter la hauteur du graphe
    const height = 400; // Changed from 300 to 400

    // Recréer le SVG avec la nouvelle hauteur
    networkSvg
        .attr("width", networkWidth)
        .attr("height", height);

    // Créer un groupe pour contenir tout le graphe
    const g = networkSvg.append("g");

    // Ajuster les forces de la simulation
    const simulation = d3.forceSimulation(nodes)
        // Ajuster la force des liens
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(80)  // Distance entre les nœuds liés
            .strength(1))  // Force des liens
        
        // Ajuster la force de répulsion
        .force("charge", d3.forceManyBody()
            .strength(-400)  // Force de répulsion plus forte
            .distanceMin(50) // Distance minimale pour la répulsion
            .distanceMax(300)) // Distance maximale pour la répulsion
        
        // Centrer le graphe
        .force("center", d3.forceCenter(networkWidth / 2, height / 2))
        
        // Éviter le chevauchement des nœuds
        .force("collide", d3.forceCollide()
            .radius(d => Math.sqrt(d.area) / 40 + 15)  // Augmenter le rayon de collision
            .strength(1))  // Force de collision maximale
        
        // Ajouter une force pour maintenir les nœuds dans les limites
        .force("x", d3.forceX(networkWidth / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1));

    const networkTooltip = d3.select("body").append("div")
        .attr("class", "network-tooltip")
        .style("opacity", 0);

    // Dessiner les liens
    const link = g.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", "#999")
        .style("stroke-opacity", 0.6)
        .style("stroke-width", 1)
        .attr("marker-end", "url(#arrow)");

    // Ajouter le marqueur de flèche
    addArrowMarker(networkSvg);

    // Dessiner les nœuds
    const node = g.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => Math.sqrt(d.area) / 40 + 5)
        .style("fill", d => indices[indexKey].colorScale(d.value))
        .style("stroke", d => d.isSelected ? "#333" : "#fff")
        .style("stroke-width", d => d.isSelected ? 2 : 1)
        .call(createDragBehavior(simulation))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                ID: ${d.pfafId}<br/>
                Surface: ${d.area.toFixed(1)} km²<br/>
                Valeur: ${d.value.toFixed(3)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Ajouter les étiquettes
    const label = g.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "node-label")
        .text(d => d.pfafId)
        .style("text-anchor", "middle")
        .style("pointer-events", "none");

    // Mise à jour des positions
    simulation.on("tick", () => {
        // Contraindre les positions des nœuds dans les limites du SVG
        nodes.forEach(d => {
            d.x = Math.max(50, Math.min(networkWidth - 50, d.x));
            d.y = Math.max(50, Math.min(height - 50, d.y));
        });

        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y + 20);
    });

    // Arrêter la simulation après un certain temps
    setTimeout(() => simulation.stop(), 3000);
}

// Fonction pour créer les liens du réseau
function createNetworkLinks(svg, links) {
    return svg.append("g")
        .selectAll("line")
        .data(links)
        .join("line")
        .style("stroke", "#999")
        .style("stroke-opacity", 0.6)
        .style("stroke-width", 1)
        .attr("marker-end", "url(#arrow)");
}

// Fonction pour ajouter le marqueur de flèche
function addArrowMarker(svg) {
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 20)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#999");
}

// Fonction pour créer les nœuds du réseau
function createNetworkNodes(svg, nodes, simulation, tooltip, indexKey) {
    return svg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => Math.sqrt(d.area) / 40 + 5)
        .style("fill", d => indices[indexKey].colorScale(d.value))
        .style("stroke", d => d.isSelected ? "#333" : "#fff")
        .style("stroke-width", d => d.isSelected ? 2 : 1)
        .call(createDragBehavior(simulation))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`
                ID: ${d.pfafId}<br/>
                Surface: ${d.area.toFixed(1)} km²<br/>
                Valeur: ${d.value.toFixed(3)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Fonction pour créer les étiquettes du réseau
function createNetworkLabels(svg, nodes) {
    return svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "node-label")
        .text(d => d.pfafId)
        .style("text-anchor", "middle")
        .style("pointer-events", "none");
}

// Fonction pour mettre à jour les positions du réseau
function updateNetworkPositions(link, node, label) {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

    label
        .attr("x", d => d.x)
        .attr("y", d => d.y + 20);
}

// Fonction pour créer le comportement de glisser-déposer
function createDragBehavior(simulation) {
    return d3.drag()
        .on("start", (event) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        })
        .on("end", (event) => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        });
}

function drag(simulation) {
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}


// Initialisation des contrôles
function initializeControls() {
    const slider = document.getElementById("month-slider");
    const monthDisplay = document.getElementById("month-display");
    const indexSelector = document.getElementById("index-selector");
    const indexInfo = document.getElementById("index-info");

    slider.addEventListener("input", function() {
        const month = parseInt(this.value);
        monthDisplay.textContent = months[month - 1];
        
        updateMap(month, indexSelector.value);
        updateVisualizations(indexSelector.value);
    });

    indexSelector.addEventListener("change", function() {
        const indexConfig = indices[this.value];
        indexInfo.textContent = indexConfig.description;
        
        updateMap(parseInt(slider.value), this.value);
        updateVisualizations(this.value);
    });
}

// Fonction principale d'initialisation
document.getElementById('country-selector').addEventListener('change', function() {
    currentCountry = this.value;
    selectedBasins.clear();
    clearCharts();
    loadInitialData();
});

// Modify initialization
function initialize() {
    // Initialize scales
    const scales = initializeScales();
    xScale = scales.xScale;
    yScale = scales.yScale;
    
    // Initialize axes
    const axes = initializeAxes(chartG, chartHeight, chartMargin);
    xAxis = axes.xAxis;
    yAxis = axes.yAxis;
    
    // Initialize controls
    initializeControls();
    initializeZoomControls();

    // Load initial data
    loadInitialData();
}

// Add at the beginning of your file
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff5555;
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Fonction pour initialiser les contrôles de zoom
function initializeZoomControls() {
    d3.select("#zoom-in").on("click", function() {
        svg.transition()
            .duration(750)
            .call(zoom.scaleBy, 1.5);
    });

    d3.select("#zoom-out").on("click", function() {
        svg.transition()
            .duration(750)
            .call(zoom.scaleBy, 0.75);
    });

    d3.select("#reset-zoom").on("click", function() {
        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    });
}
const dataCache = {};


// Add at the beginning of the file
function showLoading() {
    let loadingIndicator = document.getElementById('loading-indicator');
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        `;
        loadingIndicator.textContent = 'Loading data...';
        document.body.appendChild(loadingIndicator);
    }
    loadingIndicator.style.display = 'block';
}


function hideLoading() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}



// Initialize the map elements
function initializeMap() {
    // Initialize projection
    projection = d3.geoMercator();
    path = d3.geoPath().projection(projection);
    
    // Initialize zoom behavior
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);
    
    // Initialize SVG elements
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);
    
    // Add clip path
    svg.append("defs")
        .append("clipPath")
        .attr("id", "map-clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);
    
    // Initialize map groups
    mapGroup = svg.append("g")
        .attr("clip-path", "url(#map-clip)");
    
    g = mapGroup.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    return { svg, g, mapGroup, projection, path, zoom };
}


function handleMouseOver(event, d) {
    d3.select(this)
        .attr("fill", d => d3.rgb(d3.select(this).attr("fill")).darker(0.5))
        .attr("stroke", "#666")
        .attr("stroke-width", 2/currentZoom);

    const tooltip = d3.select(".tooltip");
    tooltip.transition()
        .duration(200)
        .style("opacity", .9);
        
    tooltip.html(`
        Basin ID: ${d.properties.PFAF_ID}<br/>
        Area: ${d.properties.UP_AREA?.toFixed(2)} km²<br/>
        Value: ${d.properties[indices[indexSelector.value].getColumn(currentDataType, 
            currentDataType === 'future' ? 
                { scenario: document.getElementById('scenario-selector').value,
                  year: document.getElementById('year-selector').value } : 
                parseInt(document.getElementById("month-slider").value)
        )]?.toFixed(3)}
    `)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function handleMouseOut(event, d) {
    d3.select(this)
        .attr("fill", d => {
            const valueColumn = indices[indexSelector.value].getColumn(currentDataType, 
                currentDataType === 'future' ? 
                    { scenario: document.getElementById('scenario-selector').value,
                      year: document.getElementById('year-selector').value } : 
                    parseInt(document.getElementById("month-slider").value)
            );
            const value = d.properties[valueColumn];
            return value ? indices[indexSelector.value].colorScale(value) : "#ccc";
        })
        .attr("stroke", "white")
        .attr("stroke-width", 0.5/currentZoom);

    d3.select(".tooltip").transition()
        .duration(500)
        .style("opacity", 0);
    
    updateBasinStyles();
}



function updateRadarChart(selectedBasinsData) {
    d3.select("#basin-chart").selectAll("*").remove();

    if (!selectedBasinsData || selectedBasinsData.length === 0) return;

    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2 - 80;

    const svg = d3.select("#basin-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width/2},${height/2})`);

    // Define indices with their proper scales
    const annualIndices = [
        { 
            key: 'bw _raw', 
            name: 'Water Stress',
            domain: [0, 0.8]  // Based on BWS scale
        },
        { 
            key: 'bwd_raw', 
            name: 'Water Depletion',
            domain: [0, 0.5]  // Based on BWD scale
        },
        { 
            key: 'iav_raw', 
            name: 'Interannual Variability',
            domain: [0, 1.0]  // Based on IAV scale
        },
        { 
            key: 'sev_raw', 
            name: 'Seasonal Variability',
            domain: [0, 1.33]  // Based on SEV scale
        },
        { 
            key: 'gtd_raw', 
            name: 'Groundwater Decline',
            domain: [-0.05, 0]  // Based on GTD scale
        },
        { 
            key: 'rfr_raw', 
            name: 'Riverine Flood Risk',
            domain: [0, 0.02]  // Based on RFR scale
        },
        { 
            key: 'drr_raw', 
            name: 'Drought Risk',
            domain: [0, 0.8]  // Based on DRR scale
        },
        { 
            key: 'ucw_raw', 
            name: 'Untreated Wastewater',
            domain: [0, 70]  // Based on UCW scale
        },
        { 
            key: 'cep_raw', 
            name: 'Coastal Eutrophication',
            domain: [0, 10]  // Based on CEP scale
        },
        { 
            key: 'rri_raw', 
            name: 'RepRisk Index',
            domain: [0, 100]  // Based on RRI scale
        }
    ];

    const angleScale = d3.scaleLinear()
        .domain([0, annualIndices.length])
        .range([0, 2 * Math.PI]);

    // Draw grid circles
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    gridLevels.forEach(level => {
        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radius * level)
            .attr("fill", "none")
            .attr("stroke", "#ddd")
            .attr("stroke-dasharray", "2,2");
    });

    // Draw axes lines
    annualIndices.forEach((ind, i) => {
        const angle = angleScale(i);
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", radius * Math.cos(angle - Math.PI/2))
            .attr("y2", radius * Math.sin(angle - Math.PI/2))
            .attr("stroke", "#ddd");
    });

    // Draw data for each basin
    selectedBasinsData.forEach((basin, index) => {
        const points = annualIndices.map((ind, i) => {
            const angle = angleScale(i);
            const value = basin[ind.key];
            
            // Normalize value between 0 and 1 based on indicator's domain
            const normalizedValue = value !== undefined ? 
                d3.scaleLinear()
                    .domain(ind.domain)
                    .range([0, 1])
                    .clamp(true)(value) : 0;

            return {
                x: radius * normalizedValue * Math.cos(angle - Math.PI/2),
                y: radius * normalizedValue * Math.sin(angle - Math.PI/2)
            };
        });

        // Create path
        svg.append("path")
            .datum(points)
            .attr("d", d => `M ${d.map(p => `${p.x},${p.y}`).join(" L ")} Z`)
            .attr("fill", d3.schemeCategory10[index])
            .attr("fill-opacity", 0.3)
            .attr("stroke", d3.schemeCategory10[index])
            .attr("stroke-width", 2);

        // Add legend
        svg.append("text")
            .attr("x", -width/2 + 10)
            .attr("y", height/2 - 40 - (index * 20))
            .text(`Basin ${basin.PFAF_ID}`)
            .attr("fill", d3.schemeCategory10[index])
            .attr("font-size", "12px");
    });

    // Add axis labels with improved positioning
    annualIndices.forEach((ind, i) => {
        const angle = angleScale(i);
        const x = (radius + 40) * Math.cos(angle - Math.PI/2);
        const y = (radius + 40) * Math.sin(angle - Math.PI/2);
        
        const anchor = (x < -1) ? "end" : (x > 1) ? "start" : "middle";
        const baseline = (y < -1) ? "baseline" : (y > 1) ? "hanging" : "middle";
        
        svg.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", anchor)
            .attr("dominant-baseline", baseline)
            .attr("font-size", "10px")
            .text(ind.name);
    });
}