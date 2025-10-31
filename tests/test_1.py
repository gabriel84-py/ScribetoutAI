import matplotlib.pyplot as plt

# Liste pour stocker la loss moyenne de chaque epoch
epoch_losses = [3.4161, 3.4069, 3.3522, 3.0816, 2.3243]

# Tracer la courbe
plt.figure(figsize=(8,5))
plt.plot(range(1, len(epoch_losses)+1), epoch_losses, marker='o')
plt.title("Loss moyenne par epoch")
plt.xlabel("Epoch")
plt.ylabel("Average Loss")
plt.grid(True)
plt.show()