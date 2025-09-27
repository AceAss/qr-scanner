import pandas as pd
import qrcode
import os
from pathlib import Path

def generate_qr_codes_from_csv(csv_file_path):
    """
    Reads a CSV file and generates QR codes for each SRN.
    
    Args:
        csv_file_path (str): Path to the CSV file containing Name, SRN, and Status columns
    """
    
    # Create qr_codes directory if it doesn't exist
    qr_codes_dir = Path("qr_codes")
    qr_codes_dir.mkdir(exist_ok=True)
    
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)
        
        # Check if required columns exist
        if 'Name' not in df.columns or 'SRN' not in df.columns:
            raise ValueError("CSV file must contain 'Name' and 'SRN' columns")
        
        print(f"Found {len(df)} records in the CSV file")
        
        # Generate QR code for each SRN
        for index, row in df.iterrows():
            srn = str(row['SRN']).strip()
            name = str(row['Name']).strip()
            
            # Get status if available
            status = row.get('Status', 'Unknown') if 'Status' in df.columns else 'Unknown'
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(srn)
            qr.make(fit=True)
            
            # Create QR code image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save the image
            filename = f"{srn}.png"
            filepath = qr_codes_dir / filename
            img.save(filepath)
            
            print(f"Generated QR code for {name} (SRN: {srn}, Status: {status}) -> {filepath}")
        
        print(f"\nAll QR codes have been generated and saved to the 'qr_codes' folder!")
        
    except FileNotFoundError:
        print(f"Error: CSV file '{csv_file_path}' not found!")
    except pd.errors.EmptyDataError:
        print("Error: The CSV file is empty!")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Generate QR codes from the CSV file
    generate_qr_codes_from_csv("paid_list_with_status.csv")
