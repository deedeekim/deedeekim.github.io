var units = "USD",
      linkTooltipOffset = 62,
      nodeTooltipOffset = 130,
      candidates = ["Bernie Sanders", "Hillary Clinton", "Marco Rubio", 
                    "Donald Trump", "Ted Cruz", "John Kasich"];

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 900 - margin.left - margin.right,
      height = 450 - margin.top - margin.bottom;

  /* Initialize tooltip */
  var tipLinks = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10,0]);

  var tipNodes = d3.tip()
      .attr('class', 'd3-tip d3-tip-nodes')
      .offset([-10, 0]);

  function formatAmount(val) {
      return val.toLocaleString("en-US", {style: 'currency', currency: "USD"}).replace(/\.[0-9]+/, "");
  };

  // append the svg canvas to the page
  var svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("class", "chart")
      .call(tipLinks)
      .call(tipNodes)
    .append("g")
      .attr("transform", 
            "translate(" + margin.left + "," + margin.top + ")");

  // Set the sankey diagram properties
  var sankey = d3.sankey()
      .nodeWidth(36)
      .nodePadding(14)
      .size([width, height]);

  var path = sankey.link();

  d3.csv("data/sankey2.csv", function(error, data) {

    var currentData = data;

    function processData(data) {
      var graph = {"nodes" : [], "links" : []};

      data.forEach(function (d) {
        graph.nodes.push({ "name": d.source,
                           "shortname": d.shortname });
        graph.nodes.push({ "name": d.target,
                           "shortname": d.shortname });
        graph.links.push({ "source": d.source,
                           "target": d.target,
                           "value": +d.value });
       });

      graph.nodesNew = d3.nest()
         .key(function (d) { return d.name; })
         .rollup(function (d) { return d[0].shortname; }) // returns the shorname of the first element of that key
         .map(graph.nodes);

       // return only the distinct / unique nodes
      graph.nodes = d3.keys(d3.nest()
         .key(function (d) { return d.name; })
         .map(graph.nodes));


      // loop through each link replacing the text with its index from node
      graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
      });

      //now loop through each nodes to make nodes an array of objects
      // rather than an array of strings
      graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = { "name": d,
                           "shortname": d };
      });
      return graph;
    }

    // "➡" 
    tipLinks.html(function(d) {
      var title, candidate;
      if (candidates.indexOf(d.source.name) > -1) {
        candidate = d.source.name;
        title = d.target.name;
        var html =  '<div class="table-wrapper">'+
            '<h1>'+title+'</h1>'+
            '<table>'+
                '<tr>'+
                    '<td class="col-left">'+candidate+'</td>'+
                    '<td align="right">'+formatAmount(d.value)+'</td>'+
                '</tr>'+
            '</table>'+
            '</div>';
      } else {
        candidate = d.target.name;
        title = d.source.name;
        var html =  '<div class="table-wrapper">'+
            '<h1>'+title+'</h1>'+
            '<table>'+
                '<tr>'+
                    '<td class="col-left">'+candidate+'</td>'+
                    '<td align="right">'+formatAmount(d.value)+'</td>'+
                '</tr>'+
            '</table>'+
            '</div>';
      }

      return html;
    });

    tipNodes.html(function(d) {
      var object = d3.entries(d),
          nodeName = object[0].value,
          linksTo = object[2].value,
          linksFrom = object[3].value,
          html;

      html =  '<div class="table-wrapper">'+
              '<h1>'+nodeName+'</h1>'+
              '<table>';
      if (linksFrom.length > 0 & linksTo.length > 0) {
        html+= '<tr><td><h2>Revenues:</h2></td><td></td></tr>'
      }
      for (i in linksFrom) {
        html += '<tr>'+
          '<td class="col-left">'+linksFrom[i].source.name+'</td>'+
          '<td align="right">'+formatAmount(linksFrom[i].value)+'</td>'+
        '</tr>';
      }
      if (linksFrom.length > 0 & linksTo.length > 0) {
        html+= '<tr><td><h2>Spending:</h2></td><td></td></tr>'
      }
      for (i in linksTo) {
        html += '<tr>'+
                  '<td class="col-left">'+linksTo[i].target.name+'</td>'+
                  '<td align="right">'+formatAmount(linksTo[i].value)+'</td>'+
                '</tr>';
      }
      html += '</table></div>';
      return html;
    });
      
    renderSankey();

    //the function for moving the nodes
    function dragmove(d) {
      d3.select(this).attr("transform", 
          "translate(" + d.x + "," + (
                  d.y = Math.max(0, Math.min(height - d.dy, d3.event.y))
              ) + ")");
      sankey.relayout();
      link.attr("d", path);
    }

    function hasLinks(node, links) {
      // checks if any links in links reference node
      l = false;
      links.forEach(function (d) {
        if (d.source == node || d.target == node) {
          l = true;
        }
      })
      return l;
    }

    d3.select('#spending-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data.filter(function (d) {
        return candidates.indexOf(d.source)+1;
      });
      renderSankey();
    });
    d3.select('#revenue-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data.filter(function (d) {
        return candidates.indexOf(d.target)+1;
      });
      renderSankey();
    });
    d3.select('#showall-button').on('click', function () {
      d3.selectAll(".sankey-label").classed("clicked", false);
      d3.select(this).classed("clicked", true);
      currentData = data;
      renderSankey();
    })

    function renderSankey() {
      d3.select('body').selectAll('g').remove();

      graph = processData(currentData);

      myLinks = graph.links;
      myNodes = graph.nodes;

      svg = d3.select('.sankey')
          .attr("width", width)
          .attr("height", height)
        .append("g");

      sankey = d3.sankey()
        .size([width, height])
        .nodes(myNodes)
        .links(myLinks)
        .layout(120);

      path = sankey.link();

      // add in the links
      link = svg.append("g").selectAll(".link")
          .data(myLinks)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", path)
          .style("stroke-width", function(d) { return Math.max(1, d.dy); })
          .sort(function(a, b) { return b.dy - a.dy; })
          .on('mousemove', function(event) {
            tipLinks
              .style("top", (d3.event.pageY - linkTooltipOffset) + "px")
              .style("left", function () {
                var left = (Math.max(d3.event.pageX - linkTooltipOffset, 10)); 
                left = Math.min(left, window.innerWidth - $('.d3-tip').width() - 20)
                return left + "px"; })
            })
          .on('mouseover', tipLinks.show)
          .on('mouseout', tipLinks.hide);

      // add in the nodes
      node = svg.append("g").selectAll(".node")
          .data(myNodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { 
              return "translate(" + d.x + "," + d.y + ")"; })
          .on('mousemove', function(event) {
            tipNodes
              .style("top", (d3.event.pageY - $('.d3-tip-nodes').height() - 20) + "px")
              .style("left", function () {
                var left = (Math.max(d3.event.pageX - nodeTooltipOffset, 10)); 
                left = Math.min(left, window.innerWidth - $('.d3-tip').width() - 20)
                return left + "px"; })
            })
          .on('mouseover', tipNodes.show)
          .on('mouseout', tipNodes.hide)
        .call(d3.behavior.drag()
          .origin(function(d) { return d; })
          .on("dragstart", function() { 
              this.parentNode.appendChild(this); })
          .on("drag", dragmove));

      // add the rectangles for the nodes
      node.append("rect")
          .attr("height", function(d) { return d.dy; })
          .attr("width", sankey.nodeWidth())
          .attr("class", function(d) { 
            if (d.name == "Bernie Sanders" || d.name == "Hillary Clinton") { d.class = 'dem'; } 
            else if (candidates.indexOf(d.name) > 1) { d.class = 'rep'; } 
            else { d.class = 'none'; }
            return d.class; });
      
      if (true) {
        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", 6 + sankey.nodeWidth())
            .attr("text-anchor", "start");
      } else {
        node.append("text")
            .attr("x", 6 + sankey.nodeWidth())
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "start")
            .attr("transform", null)
            .text(function(d) { return d.name; })
          .filter(function(d) { return d.x < width / 2; })
            .attr("x", -6)
            .attr("text-anchor", "end");
      }
    }

    d3.select(window).on('resize.sankey', renderSankey);

  });