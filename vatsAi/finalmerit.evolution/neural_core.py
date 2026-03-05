import random
import math
from typing import List, Tuple

class NeuralCore:
    """
    Custom built Neural Network for Wave Structure Recognition.
    Self-learning through geometric feedback.
    """
    def __init__(self, input_size=4, hidden_size=6, output_size=1):
        self.input_size = input_size
        self.weights1: List[List[float]] = [[random.uniform(-1, 1) for _ in range(hidden_size)] for _ in range(input_size)]
        self.bias1: List[float] = [0.0] * hidden_size
        self.weights2: List[List[float]] = [[random.uniform(-1, 1) for _ in range(output_size)] for _ in range(hidden_size)]
        self.bias2: List[float] = [0.0] * output_size

    @staticmethod
    def sigmoid(x):
        return 1 / (1 + math.exp(-max(min(x, 20), -20)))

    def forward(self, inputs):
        # Input to Hidden
        hidden = []
        for j in range(len(self.weights1[0])):
            s = sum(inputs[i] * self.weights1[i][j] for i in range(len(inputs))) + self.bias1[j]
            hidden.append(self.sigmoid(s))
        
        # Hidden to Output
        outputs = []
        for j in range(len(self.weights2[0])):
            s = sum(hidden[i] * self.weights2[i][j] for i in range(len(hidden))) + self.bias2[j]
            outputs.append(self.sigmoid(s))
        
        return outputs[0], hidden

    def train_step(self, inputs: List[float], target: float, learning_rate: float = 0.01) -> float:
        """
        Self-training logic using simple backpropagation.
        In this context, it refines the merit 'vibration' patterns.
        """
        prediction, hidden = self.forward(inputs)
        error = target - prediction
        
        # Output delta
        d_output = error * prediction * (1 - prediction)
        
        # Hidden delta
        d_hidden = []
        for i, h_val in enumerate(hidden):
            row_weights2 = self.weights2[i]
            s = sum(d_output * w2_val for w2_val in row_weights2)
            d_hidden.append(s * h_val * (1 - h_val))
            
        # Update weights 2
        for i, h_val in enumerate(hidden):
            row_weights2 = self.weights2[i]
            for j in range(len(row_weights2)):
                row_weights2[j] += learning_rate * d_output * h_val
        
        # Update weights 1
        for i, input_val in enumerate(inputs):
            row_weights1 = self.weights1[i]
            for j, dh_val in enumerate(d_hidden):
                row_weights1[j] += learning_rate * dh_val * input_val
        
        return error**2 # MSE
