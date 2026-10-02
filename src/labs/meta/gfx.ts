import type { LabMeta } from "../types";

/** 3D labs for Engineering Graphics & Design (MEP-002). */
export const GFX_LABS: LabMeta[] = [
  { id: "scalerf", title: "Drawing scales and sheet sizes", where: [["MEP-002", 1]], blurb: "Draw a real length at a standard scale on an A4, A3 or A2 sheet. See the drawn length, whether it fits, and the best standard scale.", topics: ["Engineering drawing", "Scales", "Representative fraction", "Drawing sheets"], animated: false,
    presets: [
      { name: "A room 2.4 m wide at 1:10", note: "2400 mm × 1/10 = 240 mm, which fits on an A4 sheet (usable 277 mm after a 10 mm border on each side).", values: { len: 2400, scale: "s1_10", sheet: "a4" } },
      { name: "A small part enlarged 5:1", note: "A 50 mm part drawn 5 times larger is 250 mm long: enlargement scales (2:1, 5:1) show tiny parts clearly.", values: { len: 50, scale: "s5_1", sheet: "a3" } },
      { name: "A 12 m building at 1:50", note: "12,000 mm × 1/50 = 240 mm. On A2, 1:20 would need 600 mm, more than the 574 mm usable, so 1:50 is the best standard scale.", values: { len: 12000, scale: "s1_50", sheet: "a2" } },
    ] },
  { id: "projection", title: "Projections of a line", where: [["MEP-002", 2]], blurb: "A straight line hangs in space between a horizontal and a vertical plane. See its front and top views and get its true length and inclinations.", topics: ["Projection of points", "Projection of lines", "True length", "First angle projection"], animated: false,
    presets: [
      { name: "Inclined to the HP only", note: "Both ends 20 mm in front of the VP: the top view is the true horizontal run (30) and the true length is 50 mm at 53.13° to the HP.", values: { sep: 30, h1: 10, d1: 20, h2: 50, d2: 20 } },
      { name: "Parallel to the HP", note: "Both ends 10 mm high: the front view is a horizontal line and the top view shows the true length; inclination to the HP is 0.", values: { sep: 40, h1: 10, d1: 10, h2: 10, d2: 50 } },
      { name: "Inclined to both planes", note: "Height and distance both change along the line, so both views are shorter than the true length, which must be found from a right triangle.", values: { sep: 25, h1: 5, d1: 60, h2: 45, d2: 10 } },
    ] },
  { id: "isometric", title: "Isometric view of a cube", where: [["MEP-002", 3]], blurb: "Turn a cube and watch how much each edge shrinks in the view. At 45° and 35.264° all three shrink equally to 0.8165: the isometric view.", topics: ["Isometric views", "Isometric scale", "Foreshortening", "Orthographic views"], animated: false,
    presets: [
      { name: "Isometric view", note: "From 45° round and 35.264° up, the three edges each show at 0.8165 of their length and appear 120° apart. Drawing with full lengths (isometric drawing) makes it 1.225 times bigger.", values: { az: 45, el: 35.264, edge: 50 } },
      { name: "Front view", note: "Looking straight on, the width and height edges are true length and the depth edge is a point: 1, 1 and 0.", values: { az: 0, el: 0, edge: 50 } },
      { name: "Top view", note: "Looking straight down, the width and depth edges are true length and the height edge becomes a point.", values: { az: 0, el: 90, edge: 50 } },
    ] },
  { id: "sectionplane", title: "Section of a cylinder", where: [["MEP-002", 4]], blurb: "Cut a cylinder with a plane through its centre and tilt the plane. See the section change from a circle to an ellipse and get its true area.", topics: ["Sectional views", "Cutting plane", "Ellipse", "True shape of a section"], animated: false,
    presets: [
      { name: "Flat cut", note: "A plane at right angles to the axis gives a circle of radius 20, area πr² = 1257 mm².", values: { tilt: 0, r: 20, h: 100 } },
      { name: "Inclined at 45°", note: "The section is an ellipse with semi-minor axis r = 20 and semi-major axis r / cos 45° = 28.3; its area is πr² / cos 45° = 1777 mm².", values: { tilt: 45, r: 20, h: 200 } },
      { name: "Steep cut through the ends", note: "With a short cylinder and a 60° plane the cut leaves through the top and bottom, so the section is only part of an ellipse.", values: { tilt: 60, r: 20, h: 40 } },
    ] },
  { id: "cadcoords", title: "CAD: polar coordinates and closing a shape", where: [["MEP-002", 5]], blurb: "Enter three lines by length and angle as you would in a CAD program. See each point's coordinates, then the length and angle to close the shape.", topics: ["Computer aided drafting", "Polar coordinates", "Absolute and relative input", "Closing a polygon"], animated: false,
    presets: [
      { name: "Rectangle 100 × 60", note: "@100<0, @60<90, @100<180 then close: the last side is 60 long at 270° and the area is 6000 mm².", values: { l1: 100, a1: 0, l2: 60, a2: 90, l3: 100, a3: 180 } },
      { name: "Three legs, then close", note: "@30<0, @40<90 and @10<180 end at (20, 40); closing needs a line of length 44.7 at 243.4° back to the origin.", values: { l1: 30, a1: 0, l2: 40, a2: 90, l3: 10, a3: 180 } },
      { name: "Slanted quadrilateral", note: "Angles that are not multiples of 90° give a slanted shape; the shoelace formula still gives its exact area.", values: { l1: 120, a1: 0, l2: 70, a2: 60, l3: 90, a3: 150 } },
    ] },
];
