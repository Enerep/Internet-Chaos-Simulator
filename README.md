# Internet-Chaos-Simulator
Interactive map of undersea cables, data centers and cloud regions. “Cut” a cable or AWS region and watch estimated internet routes/failures cascade.

“What happens to the internet if something breaks?”
Show a world map with:
- undersea cables
- major data centers/cloud regions
- internet exchange points
- estimated traffic routes
Then the user can click “Destroy” on a cable, cloud region or country.
The app immediately simulates:
- which routes reroute
- which regions get slower
- estimated latency increase
- overloaded backup routes
- affected services/population
- cascading failures
Example:
Cut 3 cables near Singapore -> Southeast Asian traffic starts rerouting through Japan/Australia -> certain links turn red -> latency jumps.

Maybe feature: a timeline slider showing the cascading failure over 30 seconds.
Graph algorithms like Dijkstra/max-flow + real public cable/network datasets.
