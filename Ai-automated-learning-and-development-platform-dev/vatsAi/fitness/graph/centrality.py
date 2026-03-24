class Centrality:

    def compute(self, graph):
        score = {}

        for edge in graph["edges"]:
            node = edge[0]
            score[node] = score.get(node, 0) + 1

        return score