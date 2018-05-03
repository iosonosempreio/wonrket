let table, target;

let nodes = [],
    links = [],
    previousLinks;

let forceConfig = {
    manyBody: {
        strength: -30,
        distanceMin: 1,
        distanceMax: 2000
    },
    links: {
        strength: 0
    }
}

forceConfig.manyBody.strength

function handleFileSelect(evt) {
    target = evt.target;
    if (d3.select(evt.target)
        .classed("nodes")) {
        table = 'nodes';
    } else if (d3.select(evt.target)
        .classed("edges")) {
        table = 'edges';
    }
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process text files.
        if (!f.type.match('text.*')) {
            continue;
        }

        var reader = new FileReader();

        // Read in the image file as a data URL.
        reader.readAsText(f, 'utf-8');

        // Handle progress, success, and errors
        reader.onprogress = updateProgress;
        reader.onload = loaded;
        reader.onerror = errorHandler;
    }

}

function updateProgress(evt) {
    if (evt.lengthComputable) {
        // evt.loaded and evt.total are ProgressEvent properties
        var loaded = (evt.loaded / evt.total);
        // console.log('loaded:', loaded)
        if (loaded < 1) {
            // Increase the prog bar length
            // style.width = (loaded * 200) + "px";
        }
    }
}

function loaded(evt) {

    // Obtain the read file data
    let fileString = evt.target.result;

    fileString = d3.tsvParse(fileString);

    if (table == 'nodes') {
        nodes = fileString;
        d3.select(target)
            .html('')
            .classed('filled', true)
            .html(`
              <span>Loaded ${nodes.length} nodes</span>
              <span class="clear nodes"><i class="fas fa-trash-alt"></i></span>
              `);
        d3.select('.clear.nodes')
            .on('click', function() {
                d3.select('.drop_zone.nodes')
                    .classed('filled', false)
                    .html('Drop nodes table here');
                nodes = [];

                // Also clear links
                d3.select('.drop_zone.edges')
                    .classed('filled', false)
                    .html('Drop edges table here');
                links = [];
                restart();
            })
    } else if (table == 'edges') {
        links = fileString;
        let maxWeight = d3.max(links, function(d){return d.value})
        links = links.map(function(d){
            return {
                source: d.source,
                target: d.target,
                weight: d.value/maxWeight
            }
        })
        console.log(links);
        d3.select(target)
            .html('')
            .classed('filled', true)
            .html(`
              <span>Loaded ${links.length} edges</span>
              <span class="clear edges"><i class="fas fa-trash-alt"></i></span>
              `);
        d3.select('.clear.edges')
            .on('click', function() {
                d3.select('.drop_zone.edges')
                    .classed('filled', false)
                    .html('Drop edges table here');
                links = [];
                restart();
            })
    }

    // console.log(fileString);

    if (nodes.length > 0) {
        restart();
    }

}

function errorHandler(evt) {
    if (evt.target.error.name == "NotReadableError") {
        console.error('the file could not be read');
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
d3.selectAll('.drop_zone')
    .each(function() {
        this.addEventListener('dragover', handleDragOver, false)
        this.addEventListener('drop', handleFileSelect, { 'table': 'nodes' });
    })

// Force layout here

let svg = d3.select("#force-layout");
let width = svg.node()
    .getBoundingClientRect()
    .width;
let height = svg.node()
    .getBoundingClientRect()
    .height

let simulation = d3.forceSimulation(nodes)
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink(links)
        .id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody())
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .alphaMin(0.0)
    .alpha(0)
    .on("tick", ticked);

d3.select('.restart-force')
    .on('click', function(d) {
        restart();
    })

let g = svg.append("g")
// .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
link = g.append("g")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .selectAll(".link"),
    node = g.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll(".node");

function restart() {

    console.log(`There are ${nodes.length} nodes and ${links.length} links.`);

    d3.select('body').classed('network-loaded', true);

    // Apply the general update pattern to the nodes.
    node = node.data(nodes, function(d) { return d.id; });
    node.exit()
        .remove();
    node = node.enter()
        .append("circle")
        .attr("fill", function(d) { return 'tomato'; })
        .attr("r", 4)
        .merge(node);

    // Apply the general update pattern to the links.
    link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
    link.exit()
        .remove();
    link = link.enter()
        .append("line")
        .attr('stroke', '#5D6D7E')
        .merge(link);

    // Update and restart the simulation.
    simulation.nodes(nodes)
    simulation.force("link").links(links)
    simulation.force("charge")
        .strength(forceConfig.manyBody.strength)
        .distanceMin(forceConfig.manyBody.distanceMin)
        .distanceMax(forceConfig.manyBody.distanceMax)
        .distanceMax(100000)



    simulation.alpha(1)
        .restart();
}

function ticked() {
    node.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; })

    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    d3.select('.decay-bar')
        .style('width', simulation.alpha() * 100 + '%')
}

//add zoom capabilities 
var zoom_handler = d3.zoom()
    .on("zoom", function() {
        if (true) {
            zoom_actions();
        }
    });

//Zoom functions 
function zoom_actions() {
    g.attr("transform", d3.event.transform)
}
zoom_handler(svg);

// Sliders

var slider1 = d3.sliderHorizontal()
    .min(-100)
    .max(100)
    .width(250)
    // .tickFormat(d3.format('.2%'))
    .step(1)
    .ticks(5)
    .default(-30)
    .on('onchange', val => {
        d3.select("p#value1")
            .text(val);
        forceConfig.manyBody.strength = val;
        restart();
    });

var gSlider1 = d3.select("div#slider1")
    .append("svg")
    .attr("width", 500)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)");

gSlider1.call(slider1);

d3.select("p#value1")
    .text((slider1.value()))
d3.select("#resetValue1")
    .on("click", () => slider1.value(-30));


var slider2 = d3.sliderHorizontal()
    .min(1)
    .max(500)
    .width(250)
    // .tickFormat(d3.format('.2%'))
    .step(1)
    .ticks(5)
    .default(forceConfig.manyBody.distanceMin)
    .on('onchange', val => {
        d3.select("p#value2")
            .text(val);
        forceConfig.manyBody.distanceMin = val;
        restart();
    });

var gSlider2 = d3.select("div#slider2")
    .append("svg")
    .attr("width", 500)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)");

gSlider2.call(slider2);

d3.select("p#value2")
    .text((slider2.value()))
d3.select("#resetValue1")
    .on("click", () => slider2.value(1));


var slider3 = d3.sliderHorizontal()
    .min(1)
    .max(2000)
    .width(250)
    // .tickFormat(d3.format('.2%'))
    .step(1)
    .ticks(5)
    .default(2000)
    .on('onchange', val => {
        d3.select("p#value3")
            .text(val);
        forceConfig.manyBody.distanceMax = val;
        restart();
    });

var gSlider3 = d3.select("div#slider3")
    .append("svg")
    .attr("width", 500)
    .attr("height", 100)
    .append("g")
    .attr("transform", "translate(30,30)");

gSlider3.call(slider3);

d3.select("p#value3")
    .text((slider3.value()))
d3.select("#resetValue1")
    .on("click", () => slider3.value(2000));