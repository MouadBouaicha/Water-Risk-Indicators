
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
    const sliderContainer = document.querySelector('.slider-container');
    const futureControls = document.querySelector('.future-controls');
    const indexSelector = document.getElementById('index-selector');

    if (currentDataType === 'annual') {
        sliderContainer.style.display = 'none';
        futureControls.style.display = 'none';
        indexSelector.style.display = 'none';
    }

    initializeControls();
    initializeZoomControls();
    
    loadInitialData();
});


document.getElementById('data-type-selector').addEventListener('change', function(e) {
    currentDataType = e.target.value;

    const sliderContainer = document.querySelector('.slider-container');
    const futureControls = document.querySelector('.future-controls');
    const indexSelector = document.getElementById('index-selector');

    if (currentDataType === 'annual') {
        sliderContainer.style.display = 'none';      // Hide slider for annual data
        futureControls.style.display = 'none';
        indexSelector.style.display = 'none';
    } else if (currentDataType === 'monthly') {
        indexSelector.style.display = 'block';
        sliderContainer.style.display = 'flex';      // Show slider for monthly
        futureControls.style.display = 'none';
        // Show only monthly options
        Array.from(indexSelector.getElementsByTagName('optgroup')).forEach(group => {
            group.style.display = group.classList.contains('monthly-options') ? 'block' : 'none';
        });
    } else { // future
        indexSelector.style.display = 'block';
        sliderContainer.style.display = 'none';
        futureControls.style.display = 'flex';
        Array.from(indexSelector.getElementsByTagName('optgroup')).forEach(group => {
            group.style.display = group.classList.contains('future-options') ? 'block' : 'none';
        });
    }

    selectedBasins.clear();
    clearCharts();
    loadInitialData();
});

document.getElementById('country-selector').addEventListener('change', function() {
    currentCountry = this.value;
    selectedBasins.clear();
    clearCharts();
    loadInitialData();
});

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
    const svg = d3.select("#map")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible")
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

const dataCache = {};

async function loadInitialData() {
    try {
        // Show loading indicator if you have one
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';
        
        const cacheKey = `${currentCountry}_${currentDataType}`;
        
        // Use cached data if available
        if (dataCache[cacheKey]) {
            console.log("Using cached data for", cacheKey);
            geoData = dataCache[cacheKey];
        } else {
            // Fetch fresh data
            console.log("Fetching data for", cacheKey);
            const response = await fetch(`processed_data/${currentCountry}/${currentCountry}_${currentDataType}.geojson`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            geoData = await response.json();
            
            // Cache the data without modifying it
            dataCache[cacheKey] = geoData;
        }
        
        if (geoData) {
            // Set up projection based on country
            projection = d3.geoMercator();
            
            switch(currentCountry) {
                case 'fra':
                    projection
                        .center([2.5, 46.5])
                        .scale(1500)
                        .translate([width / 2, height / 2]);
                    break;
                case 'esp':
                    projection
                        .center([-3.5, 40.2])
                        .scale(1500)
                        .translate([width / 2, height / 2]);
                    break;
                case 'deu':
                    projection
                        .center([10, 51])
                        .scale(1500)
                        .translate([width / 2, height / 2]);
                    break;
                case 'mar':
                    projection
                        .center([-6, 29])
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
        const errorMsg = document.createElement('div');
        errorMsg.style.color = 'red';
        errorMsg.style.padding = '20px';
        errorMsg.textContent = `Error loading data: ${error.message}`;
        document.getElementById('map').appendChild(errorMsg);
    } finally {
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

    function updateVisualization() {
        if (!geoData) return;
    
        // Clear existing elements
        g.selectAll("*").remove();
        
        // Use ALL features without filtering
        const validFeatures = geoData.features.filter(f => 
            f.properties.PFAF_ID !== '231110' && 
            f.properties.PFAF_ID !== '231100' && 
            f.properties.PFAF_ID !== '216042'
        );        
        // Use the country-specific projection settings
        switch(currentCountry) {
            case 'fra':
                projection
                    .center([2.5, 46.5])
                    .scale(1500)
                    .translate([width / 2, height / 2]);
                break;
            case 'esp':
                projection
                    .center([-3.5, 40.2])
                    .scale(1500)
                    .translate([width / 2, height / 2]);
                break;
            case 'deu':
                projection
                    .center([10, 51])
                    .scale(1500)
                    .translate([width / 2, height / 2]);
                break;
            case 'mar':
                projection
                    .center([-6, 29])
                    .scale(1500)
                    .translate([width / 2, height / 2]);
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
// Dans votre fonction updateBasinStyles
function updateBasinStyles() {
    // Vérifier si g est défini
    if (!g) return;

    // Mettre à jour les styles des chemins
    g.selectAll("path")
        .style("stroke", function(d) {
            if (!d || !d.properties || !d.properties.HYBAS_ID) return "white";
            return selectedBasins.has(d.properties.HYBAS_ID) ? "#ff0000" : "white";
        })
        .style("stroke-width", function(d) {
            if (!d || !d.properties || !d.properties.HYBAS_ID) return "0.5px";
            return selectedBasins.has(d.properties.HYBAS_ID) ? "2px" : "0.5px";
        })
        .style("stroke-dasharray", function(d) {
            if (!d || !d.properties || !d.properties.HYBAS_ID) return "none";
            return selectedBasins.has(d.properties.HYBAS_ID) ? "4" : "none";
        });
}
function clearCharts() {
    d3.select("#basin-chart").selectAll("*").remove();
    d3.select("#stacked-chart").selectAll("*").remove();
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

    // Update map
    if (currentDataType === 'monthly') {
        updateMap(parseInt(slider.value), this.value);
    } else {
        updateMap(1, this.value); // Default value for non-monthly data
    }

    // Update visualizations if basins are selected
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );

        // Use different visualizations based on current data type
        if (currentDataType === 'monthly') {
            updateChartMultiple(selectedBasinsData, this.value);
            updateStackedAreaChart(selectedBasinsData, this.value);
        } else if (currentDataType === 'annual') {
            updateRadarChart(selectedBasinsData);
        } else if (currentDataType === 'future') {
            updateFutureCharts(selectedBasinsData, this.value);
        }

        // Always update network graph
        updateNetworkGraphMultiple(selectedBasinsData, 
            parseInt(document.getElementById("month-slider").value || 1), 
            this.value
        );
    }
});



// Fonction pour mettre à jour la légende
function updateLegend(indexKey) {
    const indexConfig = indices[indexKey];
    if (!indexConfig) return;

    // Clear existing legend
    d3.select("#legend").selectAll("*").remove();

    // More compact dimensions
    const legendWidth = 400;
    const legendHeight = 35;  // Reduced height
    const margin = { top: 5, right: 20, bottom: 15, left: 20 };  // Reduced margins

    const legend = d3.select("#legend")
        .style("background", "white")
        .style("padding", "5px")  // Reduced padding
        .append("svg")
        .attr("width", legendWidth)
        .attr("height", legendHeight);

    // Get color scale info
    const scale = indexConfig.colorScale;
    const domain = scale.domain();
    const range = scale.range();
    const width = (legendWidth - margin.left - margin.right) / range.length;

    // Add color rectangles
    range.forEach((color, i) => {
        legend.append("rect")
            .attr("x", margin.left + (i * width))
            .attr("y", margin.top)
            .attr("width", width)
            .attr("height", 15)  // Reduced height
            .style("fill", color);
    });

    // Create scale for the axis
    const axisScale = d3.scaleLinear()
        .domain([0, d3.max(domain)])
        .range([0, legendWidth - margin.left - margin.right]);

    const axis = d3.axisBottom(axisScale)
        .tickValues([0, ...domain])
        .tickFormat(d => d.toFixed(2));

    // Add axis
    legend.append("g")
        .attr("transform", `translate(${margin.left},${margin.top + 15})`)  // Adjusted position
        .call(axis)
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "10px");  // Smaller font
}
// Modify updateMap to explicitly call updateLegend
function updateMap(month, indexKey) {
    if (!geoData) return;

    const indexConfig = indices[indexKey];
    const valueColumn = indexConfig.getColumn(currentDataType, 
        currentDataType === 'future' ? 
            { scenario: document.getElementById('scenario-selector').value,
              year: document.getElementById('year-selector').value } : 
            month
    );

    // Use ALL features without filtering
    const validFeatures = geoData.features.filter(f => 
        
        f.properties.PFAF_ID !== '231100' && 
        f.properties.PFAF_ID !== '216042'
    );

    g.selectAll("path")
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
        .on("click", handleBasinClick);

    // Update the legend
    updateLegend(indexKey);
    
    // Update selected basins styles
    updateBasinStyles();
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
    console.log("Basin clicked!");
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

        if (currentDataType === 'monthly') {
            updateChartMultiple(selectedBasinsData, indexSelector.value);
            updateStackedAreaChart(selectedBasinsData, indexSelector.value);
        } else if (currentDataType === 'annual') {
            updateRadarChart(selectedBasinsData);
        } else if (currentDataType === 'future') {
            updateFutureCharts(selectedBasinsData, indexSelector.value);
        }

        // Always update network graph
        updateNetworkGraphMultiple(selectedBasinsData, 
            parseInt(document.getElementById("month-slider").value || 1), 
            indexSelector.value
        );
    } else {
        clearCharts();
    }
}
function updateChartMultiple(basinsData, indexKey) {
    if (!basinsData || !basinsData.length) return;

    // Clear existing chart
    d3.select("#basin-chart").selectAll("*").remove();

    // Get container dimensions
    const container = d3.select("#basin-chart").node().getBoundingClientRect();
    const fullWidth = container.width;
    const fullHeight = container.height;

    // Define new margins
    const margin = {
        top: 40,
        right: 150,  // Increased for legend
        bottom: 60,  // Increased for rotated labels
        left: 60     // Increased for y-axis labels
    };

    // Calculate actual chart dimensions
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    // Create SVG with new dimensions
    const chartSvg = d3.select("#basin-chart")
        .append("svg")
        .attr("width", fullWidth)
        .attr("height", fullHeight)
        .style("background-color", "white");  // Optional: for visibility

    // Create chart group with margins
    const chartG = chartSvg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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

    const allValues = [];
    chartData.forEach(month => {
        basinsData.forEach(basin => {
            const value = month[`value_${basin.HYBAS_ID}`];
            allValues.push(value);
        });
    });

    // Create scales with proper domain
    const xScale = d3.scalePoint()
        .range([0, width])
        .domain(months);

    const [yMin, yMax] = getProperYDomain(allValues);
    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);

    // Add axes with improved styling
    // X-axis
    chartG.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Y-axis
    chartG.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

        // Create legend group
        const legendGroup = chartSvg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${width + margin.left + 20}, ${margin.top})`);
    
        // Draw lines and create legend
        basinsData.forEach((basinData, index) => {
            const line = d3.line()
                .x(d => xScale(d.month))
                .y(d => yScale(d[`value_${basinData.HYBAS_ID}`]));
    
            // Draw the line
            const path = chartG.append("path")
                .datum(chartData)
                .attr("class", `line-${basinData.HYBAS_ID}`)
                .attr("d", line)
                .style("fill", "none")
                .style("stroke", d3.schemeCategory10[index])
                .style("stroke-width", 2);
    
            // Add legend item
            const legendItem = legendGroup.append("g")
            .attr("transform", `translate(0, ${index * 25})`);

        legendItem.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d3.schemeCategory10[index]);

        legendItem.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(basinData.basin_name || `Basin ${basinData.PFAF_ID}`);

        // Add click interaction to the entire legend item
        addLegendInteraction(legendItem, basinData);
    });
    // Add axis labels
    // Y-axis label
    chartSvg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 20)
        .attr("x", -height/2 - margin.top)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Value");

    // Chart title
    chartSvg.append("text")
        .attr("x", width/2 + margin.left)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Monthly Values by Basin");
}
// Fonction pour mettre à jour le graphe réseau
function updateNetworkGraphMultiple(selectedBasins, month, indexKey) {
    // Clear existing graph
    d3.select("#network-graph").selectAll("*").remove();

    // Get container dimensions
    const container = document.getElementById('network-graph');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG
    const networkSvg = d3.select("#network-graph")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Prepare network data
    const nodes = [];
    const links = [];
    const addedNodes = new Set();

    selectedBasins.forEach(basin => {
        addBasinToNetwork(basin, nodes, links, addedNodes, 0, month, indexKey);
    });

    // Create simulation with boundaries
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id(d => d.id)
            .distance(80))
        .force("charge", d3.forceManyBody()
            .strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(0.1))
        .force("y", d3.forceY(height / 2).strength(0.1))
        .force("collision", d3.forceCollide().radius(30))
        .on("tick", ticked);

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
        .text(d => d.basin_name)
        .attr("font-size", "10px")
        .attr("dx", 12)
        .attr("dy", 4);

    // Tick function to keep nodes within bounds
    function ticked() {
        // Define boundaries with padding
        const padding = 30;
        
        nodes.forEach(d => {
            // Get node radius (using the same calculation as when creating nodes)
            const radius = Math.sqrt(d.area) / 40 + 5;
            
            // Constrain x position
            d.x = Math.max(radius + padding, Math.min(width - radius - padding, d.x));
            // Constrain y position
            d.y = Math.max(radius + padding, Math.min(height - radius - padding, d.y));
        });

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
    }

    // Drag functions
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
        
        // Fix for future projections - use proper column name construction
        const valueColumn = indices[indexKey].getColumn(
            currentDataType, 
            currentDataType === 'future' ? 
                { 
                    scenario: document.getElementById('scenario-selector').value,
                    year: document.getElementById('year-selector').value 
                } : 
                month
        );
        
        nodes.push({
            id: basinId,
            pfafId: basin.PFAF_ID,
            basin_name: basin.basin_name,
            area: basin.UP_AREA,
            value: basin[valueColumn]
        });

        const nextDownId = basin.NEXT_DOWN;
        if (nextDownId) {
            const nextDown = geoData.features.find(f => 
                f.properties.HYBAS_ID === nextDownId
            )?.properties;

            if (nextDown) {
                if (!addedNodes.has(nextDown.HYBAS_ID)) {
                    addBasinToNetwork(nextDown, nodes, links, addedNodes, depth + 1, month, indexKey);
                }
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
function createNetworkNodes(nodes, links, networkSvg, networkWidth, networkHeight, indexKey) {
    // Create node elements
    const node = networkSvg.append("g")
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", d => Math.sqrt(d.area) / 40 + 5)
        .style("fill", d => indices[indexKey].colorScale(d.value))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .call(drag(simulation));

    // Create labels with basin_name
    const label = networkSvg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "node-label")
        .text(d => d.basin_name || d.pfafId)
        .attr("x", 12)
        .attr("y", 4)
        .style("font-size", "10px")
        .style("font-family", "Arial, sans-serif")
        .style("pointer-events", "none");

    // Add hover effect for nodes
    node.on("mouseover", function(event, d) {
        const tooltip = d3.select("body").append("div")
            .attr("class", "network-tooltip")
            .style("opacity", 0);

        tooltip.transition()
            .duration(200)
            .style("opacity", .9);

        tooltip.html(`
            <div style="padding: 8px;">
                <div style="font-weight: bold;">${d.basin_name || 'N/A'}</div>
                <div>ID: ${d.pfafId}</div>
                <div>Surface: ${d.area.toFixed(2)} km²</div>
                <div>Valeur: ${d.value.toFixed(3)}</div>
            </div>
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
        d3.selectAll(".network-tooltip").remove();
    });

    return { node, label };
}

// Fonction pour créer les étiquettes du réseau
function createNetworkLabels(svg, nodes) {
    return svg.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .attr("class", "node-label")
        .text(d => d.basin_name || d.pfafId)  // Use basin_name instead of pfafId
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .style("font-size", "10px")
        .style("font-weight", "bold");
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
    const unselectAllButton = document.getElementById('unselect-all-basins');
    
    if (unselectAllButton) {
        unselectAllButton.addEventListener('click', unselectAllBasins);
    }

    slider.addEventListener("input", function() {
        const month = parseInt(this.value);
        monthDisplay.textContent = months[month - 1];
        
        updateMap(month, indexSelector.value);
        if (currentDataType === 'monthly') {
            updateVisualizations(indexSelector.value);
        }
    });

    indexSelector.addEventListener("change", function() {
        const indexConfig = indices[this.value];
        indexInfo.textContent = indexConfig.description;
        
        updateMap(parseInt(slider.value), this.value);
        
        // Update visualizations based on current data type
        if (selectedBasins.size > 0) {
            const selectedBasinsData = Array.from(selectedBasins).map(id => 
                geoData.features.find(f => f.properties.HYBAS_ID === id).properties
            );

            if (currentDataType === 'monthly') {
                updateChartMultiple(selectedBasinsData, this.value);
                updateStackedAreaChart(selectedBasinsData, this.value);
            } else if (currentDataType === 'annual') {
                updateRadarChart(selectedBasinsData);
            } else if (currentDataType === 'future') {
                updateFutureCharts(selectedBasinsData, this.value);
            }

            // Always update network graph
            updateNetworkGraphMultiple(selectedBasinsData, 
                parseInt(slider.value), 
                this.value
            );
        }
    });

    const selectAllButton = document.getElementById('select-all-basins');
    if (selectAllButton) {
        selectAllButton.addEventListener('click', function() {
            console.log("Select all button clicked");
            
            selectedBasins.clear();
            
            const countryBasins = geoData.features
                .filter(f => {
                    return f.properties.PFAF_ID !== '231110' && 
                           f.properties.PFAF_ID !== '216042';
                });

            countryBasins.forEach(basin => {
                selectedBasins.add(basin.properties.HYBAS_ID);
            });

            updateBasinStyles();

            if (selectedBasins.size > 0) {
                const selectedBasinsData = Array.from(selectedBasins)
                    .map(id => geoData.features.find(f => 
                        f.properties.HYBAS_ID === id).properties);

                if (currentDataType === 'monthly') {
                    console.log("Updating monthly visualizations");
                    updateChartMultiple(selectedBasinsData, indexSelector.value);
                    updateStackedAreaChart(selectedBasinsData, indexSelector.value);
                } else if (currentDataType === 'annual') {
                    console.log("Updating annual visualizations");
                    updateRadarChart(selectedBasinsData);
                } else if (currentDataType === 'future') {
                    console.log("Updating future visualizations");
                    updateFutureCharts(selectedBasinsData, indexSelector.value);
                }

                // Always update network graph
                updateNetworkGraphMultiple(selectedBasinsData, 
                    parseInt(slider.value), 
                    indexSelector.value
                );
            }
        });
    } else {
        console.error("Select all button not found");
    }
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
        .scaleExtent([0.5, 30])
        .on("zoom", zoomed);
    
    // Initialize SVG elements
    svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);
    
    // Initialize map groups without clip path
    mapGroup = svg.append("g");  // Removed clip-path attribute
    
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
        
    // Format area with thousand separators
    const formattedArea = new Intl.NumberFormat('fr-FR').format(d.properties.UP_AREA?.toFixed(2));
    
    // Get current value based on selected options
    const currentValue = d.properties[indices[indexSelector.value].getColumn(
        currentDataType, 
        currentDataType === 'future' ? 
            { scenario: document.getElementById('scenario-selector').value,
              year: document.getElementById('year-selector').value } : 
            parseInt(document.getElementById("month-slider").value)
    )];

    tooltip.html(`
        <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${d.properties.basin_name || 'N/A'}</div>
            <div>ID: ${d.properties.PFAF_ID}</div>
            <div>Surface: ${formattedArea} km²</div>
            ${currentValue ? `<div>Valeur: ${currentValue.toFixed(3)}</div>` : ''}
        </div>
    `)
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.1)");
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

    const width = 800;
const height = 500;
const radius = Math.min(width-130, height-130) / 2 - 80;  // Reduced width to make space for legend

// Move the entire chart left
const svg = d3.select("#basin-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width/3},${height/2})`); 




    // Define indices with their actual ranges from data analysis
    const annualIndices = [
        { 
            key: 'bw _raw', 
            name: 'Water Stress',
            domain: [0, 9.62],
            format: v => v.toFixed(2)
        },
        { 
            key: 'bwd_raw', 
            name: 'Water Depletion',
            domain: [0, 5.16],
            format: v => v.toFixed(2)
        },
        { 
            key: 'iav_raw', 
            name: 'Interannual Variability',
            domain: [0.24, 3.52],
            format: v => v.toFixed(2)
        },
        { 
            key: 'sev_raw', 
            name: 'Seasonal Variability',
            domain: [0.03, 1.08],
            format: v => v.toFixed(2)
        },
        { 
            key: 'gtd_raw', 
            name: 'Groundwater Decline',
            domain: [-1.43, 1.01],
            format: v => v.toFixed(2)
        },
        { 
            key: 'rfr_raw', 
            name: 'Riverine Flood Risk',
            domain: [0, 0.18],
            format: v => v.toFixed(3)
        },
        { 
            key: 'drr_raw', 
            name: 'Drought Risk',
            domain: [0.22, 0.91],
            format: v => v.toFixed(2)
        },
        { 
            key: 'ucw_raw', 
            name: 'Untreated Wastewater',
            domain: [-1, 1],
            format: v => v.toFixed(2)
        },
        { 
            key: 'cep_raw', 
            name: 'Coastal Eutrophication',
            domain: [-6.06, 12.10],
            format: v => v.toFixed(2)
        },
        { 
            key: 'rri_raw', 
            name: 'RepRisk Index',
            domain: [8, 86],
            format: v => v.toFixed(0)
        }
    ];

    const angleScale = d3.scaleLinear()
        .domain([0, annualIndices.length])
        .range([0, 2 * Math.PI]);

    // Draw grid circles with labels
    const gridLevels = [0.2, 0.4, 0.6, 0.8, 1];
    gridLevels.forEach(level => {
        // Draw circle
        svg.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", radius * level)
            .attr("fill", "none")
            .attr("stroke", "#ddd")
            .attr("stroke-dasharray", "2,2")
            .attr("class", "grid-circle");

        // Add percentage label
        svg.append("text")
            .attr("x", 5)
            .attr("y", -radius * level)
            .attr("fill", "#666")
            .attr("font-size", "10px")
            .text(`${(level * 100).toFixed(0)}%`);
    });

    // Draw axes lines
    annualIndices.forEach((ind, i) => {
        const angle = angleScale(i);
        svg.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", radius * Math.cos(angle - Math.PI/2))
            .attr("y2", radius * Math.sin(angle - Math.PI/2))
            .attr("stroke", "#ddd")
            .attr("stroke-width", 1);
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
                y: radius * normalizedValue * Math.sin(angle - Math.PI/2),
                rawValue: value,
                indicator: ind
            };
        });

        // Create path with hover effect
        const path = svg.append("path")
            .datum(points)
            .attr("d", d => `M ${d.map(p => `${p.x},${p.y}`).join(" L ")} Z`)
            .attr("fill", d3.schemeTableau10[index % 10]
            )
            .attr("fill-opacity", 0.3)
            .attr("stroke", d3.schemeTableau10[index % 10]
            )
            .attr("stroke-width", 2)
            .attr("class", "radar-path")
            .on("mouseover", function() {
                d3.select(this)
                    .attr("fill-opacity", 0.5)
                    .attr("stroke-width", 3);
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("fill-opacity", 0.3)
                    .attr("stroke-width", 2);
            });

        // Add points with tooltips
        svg.selectAll(null)
            .data(points)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", 4)
            .attr("fill", d3.schemeTableau10[index % 10])
            .on("mouseover", function(event, d) {
                // Enlarge point
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 6);

                // Show tooltip
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0)
                    .style("position", "absolute")
                    .style("background", "white")
                    .style("padding", "8px")
                    .style("border", "1px solid #ddd")
                    .style("border-radius", "4px")
                    .style("pointer-events", "none")
                    .style("font-size", "12px");

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(`
                    <strong>${d.indicator.name}</strong><br/>
                    Value: ${d.indicator.format(d.rawValue)}<br/>
                    Range: [${d.indicator.format(d.indicator.domain[0])}, 
                           ${d.indicator.format(d.indicator.domain[1])}]
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4);
                
                d3.selectAll(".tooltip").remove();
            });

        // Add legend item
        const legendY = (-height/3) + (index * 25);  // Start from top
        const legend = svg.append("g")
            .attr("transform", `translate(${radius + 200}, ${legendY})`);
        legend.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d3.schemeTableau10[index % 10]);

            legend.append("text")
            .attr("x", 25)
            .attr("y", 12)
            .text(basin.basin_name || `Basin ${basin.PFAF_ID}`)
            .attr("fill", "#333")
            .attr("font-size", "12px")
            .attr("font-weight", "500");
        
    });

    // Add axis labels with improved positioning
    annualIndices.forEach((ind, i) => {
        const angle = angleScale(i);
        const x = (radius + 40) * Math.cos(angle - Math.PI/2);
        const y = (radius + 40) * Math.sin(angle - Math.PI/2);
        
        const anchor = (x < -1) ? "end" : (x > 1) ? "start" : "middle";
        const baseline = (y < -1) ? "baseline" : (y > 1) ? "hanging" : "middle";
        
        // Add background for better readability
        const label = svg.append("g")
            .attr("transform", `translate(${x},${y})`);

        // Add label with dynamic positioning
        label.append("text")
    .attr("text-anchor", anchor)
    .attr("dominant-baseline", baseline)
    .attr("fill", "#333")
    .attr("font-size", "12px")         // Increased from 11px
    .attr("font-weight", "bold")       // Changed from 500 to bold
    .style("font-family", "Arial")    // Added for better visibility
    .text(ind.name);
    });
}







function updateStackedAreaChart(selectedBasinsData, indexKey) {
    // Clear previous content
    d3.select("#stacked-chart").selectAll("*").remove();

    if (!selectedBasinsData || selectedBasinsData.length === 0) return;

    // Get container dimensions
    const container = document.getElementById('stacked-chart');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Define fixed margins
    const margin = {
        top: 30,
        right: 120,
        bottom: 50,
        left: 60
    };

    // Calculate actual chart dimensions
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG with container dimensions
    const svg = d3.select("#stacked-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Prepare data for stacking
    const monthlyData = months.map((month, i) => {
        const monthStr = (i + 1).toString().padStart(2, '0');
        const data = { month };
        
        selectedBasinsData.forEach(basin => {
            const valueColumn = indices[indexKey].getColumn('monthly', monthStr);
            data[basin.basin_name || `Basin ${basin.PFAF_ID}`] = basin[valueColumn] || 0;
        });
        
        return data;
    });

    // Create stack generator
    const stack = d3.stack()
        .keys(selectedBasinsData.map(d => d.basin_name || `Basin ${d.PFAF_ID}`))
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const series = stack(monthlyData);

   // Get all values for proper scaling
   const allValues = [];
   series.forEach(layer => {
       layer.forEach(point => {
           allValues.push(point[0]); // Lower value
           allValues.push(point[1]); // Upper value
       });
   });

   // Get proper y-domain
   const yDomain = getProperYDomain(allValues);

   // Create scales
   const x = d3.scalePoint()
       .domain(months)
       .range([0, chartWidth]);

   const y = d3.scaleLinear()
       .domain(yDomain)
       .nice()
       .range([chartHeight, 0]);

   const color = d3.scaleOrdinal()
       .domain(selectedBasinsData.map(d => d.basin_name || `Basin ${d.PFAF_ID}`))
       .range(d3.schemeTableau10);

    // Create area generator with fixed dimensions
    const area = d3.area()
        .x(d => x(d.data.month))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    // Add areas
    svg.append("g")
        .selectAll("path")
        .data(series)
        .join("path")
        .attr("fill", d => color(d.key))
        .attr("d", area)
        .style("opacity", 0.8);

    // Add X axis with rotated labels
    svg.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    // Add Y axis
    svg.append("g")
        .call(d3.axisLeft(y)
            .ticks(10)
            .tickFormat(d => d.toFixed(1)));

    // Add legend with fixed positioning
    const legend = svg.append("g")
        .attr("transform", `translate(${chartWidth + 10}, 0)`);

    selectedBasinsData.forEach((d, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", color(d.basin_name || `Basin ${d.PFAF_ID}`));

        legendRow.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .style("font-size", "12px")
            .text(d.basin_name || `Basin ${d.PFAF_ID}`);
    });

    // Add title
    svg.append("text")
        .attr("x", chartWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Monthly Values Distribution");
}





function getCurrentCountryBasins() {
    return geoData.features.filter(f => {
        // Filtrer les bassins invalides et vérifier le pays
        return f.properties.PFAF_ID !== '231110' && 
               f.properties.PFAF_ID !== '216042' &&
               f.properties.country?.toLowerCase() === currentCountry.toLowerCase();
    });
}



function selectAllBasins() {
    console.log("Selecting all basins for current country:", currentCountry);
    
    // Get valid basins for the current country
    const countryBasins = geoData.features.filter(f => {
        return f.properties.PFAF_ID !== '231110' && 
               f.properties.PFAF_ID !== '216042' &&
               !f.properties.PFAF_ID.startsWith('231');
    });
    
    // Add all basins to selection
    countryBasins.forEach(basin => {
        selectedBasins.add(basin.properties.HYBAS_ID);
    });

    // Update styles
    updateBasinStyles();
    
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins)
            .map(id => geoData.features.find(f => 
                f.properties.HYBAS_ID === id).properties);

        // Always update network graph
        updateNetworkGraphMultiple(selectedBasinsData, 
            parseInt(document.getElementById("month-slider").value || 1), 
            indexSelector.value
        );

        // Update other visualizations based on data type
        if (currentDataType === 'monthly') {
            console.log("Updating monthly visualizations");
            updateChartMultiple(selectedBasinsData, indexSelector.value);
            updateStackedAreaChart(selectedBasinsData, indexSelector.value);
        } else if (currentDataType === 'annual') {
            console.log("Updating annual visualizations");
            updateRadarChart(selectedBasinsData);
        }
    }
}

function unselectAllBasins() {
    console.log("Unselecting all basins");
    
    // Clear selected basins
    selectedBasins.clear();
    
    // Update styles
    updateBasinStyles();
    
    // Clear all charts
    clearCharts();

    // Create empty network graph to maintain consistency
    updateNetworkGraphMultiple([], 
        parseInt(document.getElementById("month-slider").value || 1), 
        indexSelector.value
    );
}



document.getElementById('toggle-info').addEventListener('click', function() {
    const sidebar = document.getElementById('info-sidebar');
    sidebar.classList.toggle('active');
});

document.getElementById('close-sidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('info-sidebar');
    sidebar.classList.remove('active');
});




function isValidBasin(feature) {
    if (!feature || !feature.properties) return false;
    
    // For Spain, we only want to filter specific problematic basins
    if (currentCountry === 'esp') {
        return f.properties.PFAF_ID !== '231110' && 
               f.properties.PFAF_ID !== '216042';
    }
    
    return true;
}
function updateFutureCharts(selectedBasinsData, indexKey) {
    console.log("Selected basins data:", selectedBasinsData);
    
    // Clear existing charts
    d3.select("#basin-chart").selectAll("*").remove();
    d3.select("#stacked-chart").selectAll("*").remove();

    if (!selectedBasinsData || selectedBasinsData.length === 0) return;

    // Get current selections from UI
    const selectedScenario = document.getElementById('scenario-selector').value; // bau, opt, or pes
    const selectedYear = document.getElementById('year-selector').value; // 30, 50, or 80

    // Map the indexKey to the correct metric key
    const metricMap = {
        'bws': 'ws',   // Water Stress
        'bwd': 'wd',   // Water Depletion
        'iav': 'iv',   // Interannual Variability
        'sev': 'sv'    // Seasonal Variability
    };
    
    // Get the correct metric key
    const metric = metricMap[indexKey] || indexKey;
    
    // Construct the correct column name
    const columnName = `${selectedScenario}${selectedYear}_${metric}_x_r`;
    console.log("Looking for column:", columnName);

    // Prepare data for visualization
    const chartData = selectedBasinsData.map(basin => {
        const value = basin[columnName];
        console.log("Basin:", basin.basin_name || basin.PFAF_ID, "Value:", value);
        
        return {
            basinName: basin.basin_name || `Basin ${basin.PFAF_ID}`,
            value: value
        };
    }).filter(d => typeof d.value === 'number' && !isNaN(d.value));

    console.log("Prepared chart data:", chartData);

    // Set up dimensions
    const container = d3.select("#basin-chart");
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;
    const margin = { top: 40, right: 120, bottom: 100, left: 60 };

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const chartArea = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.basinName))
        .range([0, chartWidth])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.value) * 1.1])
        .range([chartHeight, 0]);

    // Add axes
    chartArea.append("g")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em");

    chartArea.append("g")
        .call(d3.axisLeft(yScale));

    // Add bars
    chartArea.selectAll("rect")
        .data(chartData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.basinName))
        .attr("y", d => yScale(d.value))
        .attr("width", xScale.bandwidth())
        .attr("height", d => chartHeight - yScale(d.value))
        .attr("fill", "#2c7fb8")
        .attr("opacity", 0.8);

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(`${metric.toUpperCase()} Values for 20${selectedYear} (${selectedScenario.toUpperCase()})`);

    // Create value table in stacked chart area
    const tableContainer = d3.select("#stacked-chart")
        .append("div")
        .style("padding", "20px")
        .style("height", "100%")
        .style("overflow-y", "auto");

    const table = tableContainer.append("table")
        .style("width", "100%")
        .style("border-collapse", "collapse");

    // Add table header
    const thead = table.append("thead");
    thead.append("tr")
        .selectAll("th")
        .data(["Basin", "Value"])
        .enter()
        .append("th")
        .style("padding", "8px")
        .style("border-bottom", "2px solid #ddd")
        .style("text-align", "left")
        .text(d => d);

    // Add table body
    const tbody = table.append("tbody");
    chartData.forEach(d => {
        const row = tbody.append("tr");
        row.append("td")
            .style("padding", "8px")
            .style("border-bottom", "1px solid #ddd")
            .text(d.basinName);
        row.append("td")
            .style("padding", "8px")
            .style("border-bottom", "1px solid #ddd")
            .text(d.value.toFixed(2));
    });
}

// Add event listeners for the selectors
document.getElementById('scenario-selector').addEventListener('change', function() {
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );
        updateFutureCharts(selectedBasinsData, indexSelector.value);
    }
});

document.getElementById('year-selector').addEventListener('change', function() {
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );
        updateFutureCharts(selectedBasinsData, indexSelector.value);
    }
});

document.getElementById('select-all-basins').addEventListener('click', selectAllBasins);
document.getElementById('unselect-all-basins').addEventListener('click', unselectAllBasins);


document.getElementById('index-selector').addEventListener('change', function() {
    const indexConfig = indices[this.value];
    indexInfo.textContent = indexConfig.description;
    
    if (selectedBasins.size > 0) {
        const selectedBasinsData = Array.from(selectedBasins).map(id => 
            geoData.features.find(f => f.properties.HYBAS_ID === id).properties
        );

        // Use different visualizations based on current data type
        if (currentDataType === 'monthly') {
            updateChartMultiple(selectedBasinsData, this.value);
            updateStackedAreaChart(selectedBasinsData, this.value);
        } else if (currentDataType === 'annual') {
            updateRadarChart(selectedBasinsData);
        } else if (currentDataType === 'future') {
            updateFutureCharts(selectedBasinsData, this.value);
        }

        // Always update network graph and map
        updateNetworkGraphMultiple(selectedBasinsData, 
            parseInt(document.getElementById("month-slider").value || 1), 
            this.value
        );
        updateMap(parseInt(document.getElementById("month-slider").value || 1), this.value);
    }
});




function getProperYDomain(values) {
    // Filter out invalid values
    const validValues = values.filter(v => v !== undefined && v !== null && !isNaN(v) && v >= 0);
    if (validValues.length === 0) return [0, 1];

    // Get basic statistics
    const max = d3.max(validValues);
    const mean = d3.mean(validValues);
    
    // If max is extremely larger than mean, use a more reasonable upper bound
    const upperBound = (max > mean * 10) ? mean * 3 : max;
    
    return [0, upperBound * 1.1]; // Add 10% padding
}



function addLegendInteraction(legendItem, basinData) {
    // Make both rect and text clickable
    legendItem.style("cursor", "pointer")
        .on("click", () => {
            // Remove the basin from selectedBasins
            selectedBasins.delete(basinData.HYBAS_ID);
            
            // Update basin styles on the map
            updateBasinStyles();
            
            // Update all visualizations with remaining selected basins
            if (selectedBasins.size > 0) {
                const selectedBasinsData = Array.from(selectedBasins).map(id => 
                    geoData.features.find(f => f.properties.HYBAS_ID === id).properties
                );

                if (currentDataType === 'monthly') {
                    updateChartMultiple(selectedBasinsData, indexSelector.value);
                    updateStackedAreaChart(selectedBasinsData, indexSelector.value);
                } else if (currentDataType === 'annual') {
                    updateRadarChart(selectedBasinsData);
                } else if (currentDataType === 'future') {
                    updateFutureCharts(selectedBasinsData, indexSelector.value);
                }

                // Always update network graph
                updateNetworkGraphMultiple(selectedBasinsData, 
                    parseInt(document.getElementById("month-slider").value || 1), 
                    indexSelector.value
                );
            } else {
                // If no basins left, clear all charts
                clearCharts();
            }
        });
}