# StatusPage CLI

A command-line tool for managing your status page.

## Installation

```bash
pip install -r cli/requirements.txt
```

## Usage

```bash
# List components
python cli/statuspage.py --token YOUR_TOKEN components list

# Create a component
python cli/statuspage.py --token YOUR_TOKEN components create "API Gateway"

# Update component status
python cli/statuspage.py --token YOUR_TOKEN components update COMPONENT_ID degraded_performance

# List incidents
python cli/statuspage.py --token YOUR_TOKEN incidents list

# Create an incident
python cli/statuspage.py --token YOUR_TOKEN incidents create "API Latency Issues" --impact major

# Update incident
python cli/statuspage.py --token YOUR_TOKEN incidents update INCIDENT_ID "Fixed the issue" --status resolved

# Check public status
python cli/statuspage.py status my-org
```

## Environment Variables

```bash
export STATUSPAGE_URL=https://api.statuspage.example.com
export STATUSPAGE_TOKEN=your-api-token
```
