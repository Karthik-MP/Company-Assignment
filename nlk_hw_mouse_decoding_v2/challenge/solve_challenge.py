import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import time
from matplotlib.widgets import Button

# Read the CSV file
df = pd.read_csv('mouse_velocities.csv')

# IMPORTANT: Set velocity_y to zero as per the hidden instruction (when IMPORTING to other tools)
# But for visualization, we use actual velocities to see the handwriting

# Calculate positions by integrating velocities
positions_x = np.cumsum(df['velocity_x'].values)
positions_y = np.cumsum(df['velocity_y'].values)

# Calculate screen bounds
x_min, x_max = positions_x.min(), positions_x.max()
y_min, y_max = positions_y.min(), positions_y.max()

print("Screen bounds:")
print(f"X: [{x_min:.2f}, {x_max:.2f}] (range: {x_max - x_min:.2f})")
print(f"Y: [{y_min:.2f}, {y_max:.2f}] (range: {y_max - y_min:.2f})")
print(f"Total points: {len(positions_x)}\n")

# Control variables
class PlotController:
    def __init__(self):
        self.paused = False
        self.reset_requested = False
        self.current_index = 0
        self.identified_letters = []
        self.snapshot_counter = 1
        
controller = PlotController()

# Create the plot
fig = plt.figure(figsize=(16, 10))
ax = fig.add_subplot(111)
plt.subplots_adjust(bottom=0.15)

ax.set_title('Mouse Trajectory - Handwritten Text', fontsize=16)
ax.set_xlabel('X Position', fontsize=12)
ax.set_ylabel('Y Position', fontsize=12)
ax.grid(True, alpha=0.3)
ax.set_xlim(x_min - 50, x_max + 50)
ax.set_ylim(y_min - 50, y_max + 50)
ax.invert_yaxis()

# Add buttons
ax_stop = plt.axes([0.15, 0.02, 0.12, 0.05])
ax_continue = plt.axes([0.28, 0.02, 0.12, 0.05])
ax_reset = plt.axes([0.41, 0.02, 0.12, 0.05])
ax_snapshot = plt.axes([0.54, 0.02, 0.12, 0.05])
ax_snap_reset = plt.axes([0.67, 0.02, 0.18, 0.05])

btn_stop = Button(ax_stop, 'Stop/Pause')
btn_continue = Button(ax_continue, 'Continue')
btn_reset = Button(ax_reset, 'Reset View')
btn_snapshot = Button(ax_snapshot, 'Snapshot')
btn_snap_reset = Button(ax_snap_reset, 'Snap & Reset')

def on_stop(event):
    controller.paused = True
    print("\n⏸️  PAUSED - Identify the letter, then click Continue or Reset")
    
def on_continue(event):
    controller.paused = False
    print("▶️  CONTINUING...\n")
    
def on_reset(event):
    controller.reset_requested = True
    ax.clear()
    ax.set_title('Mouse Trajectory - Handwritten Text', fontsize=16)
    ax.set_xlabel('X Position', fontsize=12)
    ax.set_ylabel('Y Position', fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(x_min - 50, x_max + 50)
    ax.set_ylim(y_min - 50, y_max + 50)
    ax.invert_yaxis()
    plt.draw()
    controller.reset_requested = False
    controller.paused = False
    print("🔄 VIEW RESET - Starting fresh\n")

def on_snapshot(event):
    filename = f'letter_{controller.snapshot_counter}.png'
    fig.savefig(filename, dpi=150, bbox_inches='tight')
    print(f"📸 SNAPSHOT SAVED: {filename}")
    controller.snapshot_counter += 1

def on_snap_and_reset(event):
    # Save snapshot first
    filename = f'letter_{controller.snapshot_counter}.png'
    fig.savefig(filename, dpi=150, bbox_inches='tight')
    print(f"📸 SNAPSHOT SAVED: {filename}")
    controller.snapshot_counter += 1
    
    # Then reset the view
    controller.reset_requested = True
    ax.clear()
    ax.set_title('Mouse Trajectory - Handwritten Text', fontsize=16)
    ax.set_xlabel('X Position', fontsize=12)
    ax.set_ylabel('Y Position', fontsize=12)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(x_min - 50, x_max + 50)
    ax.set_ylim(y_min - 50, y_max + 50)
    ax.invert_yaxis()
    plt.draw()
    controller.reset_requested = False
    controller.paused = False
    print("🔄 VIEW RESET - Ready for next letter\n")

btn_stop.on_clicked(on_stop)
btn_continue.on_clicked(on_continue)
btn_reset.on_clicked(on_reset)
btn_snapshot.on_clicked(on_snapshot)
btn_snap_reset.on_clicked(on_snap_and_reset)

# Plot 10 points at a time with 5-second pauses
batch_size = 10
total_points = len(positions_x)

for i in range(0, total_points, batch_size):
    # Check if paused
    while controller.paused and not controller.reset_requested:
        plt.pause(0.1)
        if controller.reset_requested:
            break
    
    if controller.reset_requested:
        controller.current_index = i
        continue
    
    end_idx = min(i + batch_size, total_points)
    
    # Check for (0,0) coordinates in this batch - indicates letter boundary
    for idx in range(i, end_idx):
        if df.iloc[idx]['velocity_x'] == 0 and df.iloc[idx]['velocity_y'] == 0:
            # Found a letter boundary - auto-save and reset
            filename = f'letter_{controller.snapshot_counter}.png'
            fig.savefig(filename, dpi=150, bbox_inches='tight')
            print(f"\n📸 AUTO-SAVED (0,0 detected): {filename}")
            controller.snapshot_counter += 1
            
            # Reset the view
            ax.clear()
            ax.set_title('Mouse Trajectory - Handwritten Text', fontsize=16)
            ax.set_xlabel('X Position', fontsize=12)
            ax.set_ylabel('Y Position', fontsize=12)
            ax.grid(True, alpha=0.3)
            ax.set_xlim(x_min - 50, x_max + 50)
            ax.set_ylim(y_min - 50, y_max + 50)
            ax.invert_yaxis()
            plt.draw()
            print("🔄 AUTO-RESET - New letter started\n")
            break
    
    # Plot the batch
    if i == 0:
        ax.plot(positions_x[i:end_idx], positions_y[i:end_idx], 'b-', linewidth=2, alpha=0.7)
        ax.plot(positions_x[i], positions_y[i], 'go', markersize=10, label='Start', zorder=5)
    else:
        ax.plot(positions_x[i:end_idx], positions_y[i:end_idx], 'b-', linewidth=2, alpha=0.7)
    
    # Mark the current endpoint
    ax.plot(positions_x[end_idx-1], positions_y[end_idx-1], 'ro', markersize=6, zorder=5)
    
    # Update the plot
    ax.legend()
    plt.draw()
    plt.pause(0.1)
    
    # Print progress
    print(f"Plotted points {i} to {end_idx-1} (Total: {end_idx}/{total_points})")
    
    # Wait 5 seconds before next batch (except for the last batch)
    # if end_idx < total_points:
    #     print("Waiting 5 seconds... (or click Stop to pause)")
    #     for _ in range(50):  # 5 seconds = 50 * 0.1s
    #         if controller.paused or controller.reset_requested:
    #             break
    #         # plt.pause(0.1)

print("\n✅ Plotting complete!")
print(f"Total points plotted: {total_points}")
print("\n📝 Analyze the plot to decipher the handwritten text.")
print("The answer should be in ALL UPPERCASE.")
print("\nButtons:")
print("  • Stop/Pause - Pause plotting")
print("  • Continue - Resume plotting")
print("  • Reset View - Clear the plot")
print("  • Snapshot - Save current plot as letter_N.png")
print("  • Snap & Reset - Save snapshot and clear plot for next letter")
print("\nSnapshots will be saved as: letter_1.png, letter_2.png, etc.")

plt.show()
