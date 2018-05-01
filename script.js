let table, target;

let nodes = [], links = [];

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
            .classed('filled', true)
            .html(`Selected ${nodes.length} nodes`);
    } else if (table == 'edges') {
        links = fileString;
        d3.select(target)
            .classed('filled', true)
            .html(`Selected ${links.length} edges`);
    }

    // console.log(fileString);

    // console.log(nodes, links)

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
let width = svg.node().getBoundingClientRect().width;
let height = svg.node().getBoundingClientRect().height

let simulation = d3.forceSimulation(nodes)
    .force("center", d3.forceCenter(0,0))
    .force("link", d3.forceLink(links).id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("x", d3.forceX(0))
    .force("y", d3.forceY(0))
    
    .alphaTarget(1)
    .on("tick", ticked);

let g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"),
    link = g.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link"),
    node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");



function restart() {

  // Apply the general update pattern to the nodes.
  node = node.data(nodes, function(d) { return d.id;});
  node.exit().remove();
  node = node.enter()
          .append("circle")
          .attr("fill", function(d) { return 'black'; })
          .attr("r", 4)
          .merge(node);

  // Apply the general update pattern to the links.
  link = link.data(links, function(d) { return d.source.id + "-" + d.target.id; });
  link.exit().remove();
  link = link.enter().append("line").merge(link);

  // Update and restart the simulation.
  simulation.nodes(nodes);
  simulation.force("link").links(links);
  simulation.alpha(1).restart();
}

function ticked() {
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; })

  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
}
