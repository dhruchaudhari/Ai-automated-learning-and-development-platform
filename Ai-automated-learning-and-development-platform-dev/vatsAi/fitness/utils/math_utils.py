import numpy as np
from config import EPSILON

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def safe_divide(a, b):
    return a / (b + EPSILON)

def normalize_vector(vec):
    vec = np.array(vec)
    return (vec - vec.min()) / (vec.max() - vec.min() + EPSILON)

def diminishing_growth(value, lam):
    return 1 - np.exp(-lam * value)