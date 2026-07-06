import xml.etree.ElementTree as ET

def build_usecase_xml():
    mxGraphModel = ET.Element('mxGraphModel', dx="1200", dy="800", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="827", pageHeight="1169", math="0", shadow="0")
    root = ET.SubElement(mxGraphModel, 'root')
    
    # Base cells
    ET.SubElement(root, 'mxCell', id="0")
    ET.SubElement(root, 'mxCell', id="1", parent="0")

    # Actors on the left
    actors = [
        {"id": "a_victim", "name": "Victim (User)", "y": 100},
        {"id": "a_ngo", "name": "NGO", "y": 280},
        {"id": "a_admin", "name": "Admin", "y": 460},
        {"id": "a_volunteer", "name": "Volunteer", "y": 640}
    ]
    for act in actors:
        style = "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=12;fontStyle=1;align=center;verticalAlign=middle;"
        cell = ET.SubElement(root, 'mxCell', id=act["id"], value=act["name"], style=style, parent="1", vertex="1")
        ET.SubElement(cell, 'mxGeometry', x="100", y=str(act["y"]), width="90", height="90", as_="geometry")

    # System boundary box
    box_style = "swimlane;whiteSpace=wrap;html=1;childLayout=stackLayout;horizontal=1;startSize=30;horizontalStack=0;fillColor=#fff2cc;strokeColor=#d6b656;fontSize=14;fontStyle=1;align=center;"
    box = ET.SubElement(root, 'mxCell', id="sys_box", value="ResQAI System", style=box_style, parent="1", vertex="1")
    ET.SubElement(box, 'mxGeometry', x="300", y="50", width="280", height="800", as_="geometry")

    # Use cases
    use_cases = [
        {"id": "uc_history", "name": "Track Rescue History", "y": 90},
        {"id": "uc_sos", "name": "Request SOS Emergency", "y": 160},
        {"id": "uc_pred", "name": "View All Predictions & Map", "y": 230},
        {"id": "uc_deploy", "name": "Deploy Assets", "y": 300},
        {"id": "uc_signals", "name": "Review Strategic Signals", "y": 370},
        {"id": "uc_login", "name": "Register & Login", "y": 440},
        {"id": "uc_audit", "name": "Audit Verification Photos", "y": 510},
        {"id": "uc_assign", "name": "Assign Field Tasks", "y": 580},
        {"id": "uc_upload", "name": "Upload Completion Proof", "y": 650},
        {"id": "uc_execute", "name": "Executor Field Operations", "y": 720}
    ]
    uc_style = "ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;align=center;"
    for uc in use_cases:
        cell = ET.SubElement(root, 'mxCell', id=uc["id"], value=uc["name"], style=uc_style, parent="1", vertex="1")
        ET.SubElement(cell, 'mxGeometry', x="350", y=str(uc["y"]), width="180", height="50", as_="geometry")

    # Connections
    connections = [
        ("a_victim", "uc_history"), ("a_victim", "uc_sos"), ("a_victim", "uc_pred"), ("a_victim", "uc_login"),
        ("a_ngo", "uc_pred"), ("a_ngo", "uc_deploy"), ("a_ngo", "uc_signals"), ("a_ngo", "uc_login"),
        ("a_admin", "uc_pred"), ("a_admin", "uc_login"), ("a_admin", "uc_audit"), ("a_admin", "uc_assign"),
        ("a_volunteer", "uc_login"), ("a_volunteer", "uc_upload"), ("a_volunteer", "uc_execute")
    ]
    edge_style = "endArrow=none;html=1;rounded=0;strokeWidth=1;strokeColor=#666666;"
    for idx, (src, tgt) in enumerate(connections):
        edge = ET.SubElement(root, 'mxCell', id=f"edge_{idx}", style=edge_style, parent="1", source=src, target=tgt, edge="1")
        ET.SubElement(edge, 'mxGeometry', as_="geometry")

    ET.ElementTree(mxGraphModel).write("usecase_mx.xml", encoding="utf-8", xml_declaration=False)

def build_dfd_xml():
    # Let's align DFD according to their Exact Page-3 DFD reference layout screenshot!
    # Entities:
    # 1. Citizen / Victim (top rectangle)
    # 2. NGO / Authority (middle-left rectangle)
    # 3. Volunteer Unit (bottom-left rectangle)
    # 4. System Admin (bottom-right rectangle)
    # Databases:
    # 1. Disasters DB (under predict, top-left)
    # 2. Requests DB (middle-left)
    # 3. Tasks DB (lower-left)
    # 4. Users DB (bottom-center)
    # Processes:
    # 1. 2.0 AI Disaster Prediction (upper-left circle)
    # 2. 3.0 SOS Request Processing (upper-right circle)
    # 3. 4.0 Dispatch Management (middle circle)
    # 4. 5.0 Rescue Execution (lower circle)
    # 5. 6.0 History & Verification (lower-middle circle)
    # 6. 1.0 User Authentication (bottom circle)

    mxGraphModel = ET.Element('mxGraphModel', dx="1200", dy="800", grid="1", gridSize="10", guides="1", tooltips="1", connect="1", arrows="1", fold="1", page="1", pageScale="1", pageWidth="827", pageHeight="1169", math="0", shadow="0")
    root = ET.SubElement(mxGraphModel, 'root')
    
    # Base cells
    ET.SubElement(root, 'mxCell', id="0")
    ET.SubElement(root, 'mxCell', id="1", parent="0")

    # Entities (Rectangles)
    ent_style = "rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=12;fontStyle=1;align=center;"
    entities = [
        {"id": "e_victim", "name": "Citizen / Victim", "x": 350, "y": 20},
        {"id": "e_ngo", "name": "NGO / Authority", "x": 100, "y": 300},
        {"id": "e_volunteer", "name": "Volunteer Unit", "x": 100, "y": 550},
        {"id": "e_admin", "name": "System Admin", "x": 580, "y": 800}
    ]
    for ent in entities:
        cell = ET.SubElement(root, 'mxCell', id=ent["id"], value=ent["name"], style=ent_style, parent="1", vertex="1")
        ET.SubElement(cell, 'mxGeometry', x=str(ent["x"]), y=str(ent["y"]), width="130", height="50", as_="geometry")

    # Processes (Circles)
    pr_style = "ellipse;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=11;align=center;"
    processes = [
        {"id": "p_pred", "name": "2.0 AI Disaster\nPrediction", "x": 200, "y": 120},
        {"id": "p_sos", "name": "3.0 SOS Request\nProcessing", "x": 500, "y": 120},
        {"id": "p_dispatch", "name": "4.0 Dispatch\nManagement", "x": 350, "y": 290},
        {"id": "p_execute", "name": "5.0 Rescue\nExecution", "x": 350, "y": 450},
        {"id": "p_history", "name": "6.0 History &\nVerification", "x": 350, "y": 620},
        {"id": "p_auth", "name": "1.0 User\nAuthentication", "x": 350, "y": 800}
    ]
    for pr in processes:
        cell = ET.SubElement(root, 'mxCell', id=pr["id"], value=pr["name"], style=pr_style, parent="1", vertex="1")
        ET.SubElement(cell, 'mxGeometry', x=str(pr["x"]), y=str(pr["y"]), width="100", height="100", as_="geometry")

    # Data Stores (DFD double line open-ended)
    ds_style = "shape=partialRectangle;right=0;left=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;fontSize=12;fontStyle=1;align=center;"
    stores = [
        {"id": "ds_disasters", "name": "Disasters DB", "x": 105, "y": 150},
        {"id": "ds_requests", "name": "Requests DB", "x": 585, "y": 290},
        {"id": "ds_tasks", "name": "Tasks DB", "x": 585, "y": 450},
        {"id": "ds_users", "name": "Users DB", "x": 340, "y": 950}
    ]
    for ds in stores:
        cell = ET.SubElement(root, 'mxCell', id=ds["id"], value=ds["name"], style=ds_style, parent="1", vertex="1")
        ET.SubElement(cell, 'mxGeometry', x=str(ds["x"]), y=str(ds["y"]), width="120", height="40", as_="geometry")

    # Connective flows (matching visual paths)
    flows = [
        # Victim connects to Prediction
        ("e_victim", "p_pred", "Weather API / Telemetry"),
        ("p_pred", "e_victim", "Disaster Forecast"),
        ("p_pred", "ds_disasters", "Log Telemetry"),

        # Victim connects to SOS Request
        ("e_victim", "p_sos", "Submit SOS Form"),
        ("p_sos", "ds_requests", "Save SOS Request"),
        
        # NGO interacts with Dispatch
        ("e_ngo", "p_dispatch", "Trigger Deployment"),
        ("ds_requests", "p_dispatch", "Load Unassigned signals"),
        ("p_dispatch", "ds_tasks", "Save Dispatch Task"),
        ("p_dispatch", "e_admin", "Escalate SOS Signal"),

        # Admin dispatches to execute
        ("e_admin", "p_dispatch", "Assign Field Team"),
        ("p_dispatch", "e_volunteer", "Notify Volunteers"),
        
        # Volunteer executes task
        ("e_volunteer", "p_execute", "Execute Rescue"),
        ("p_execute", "ds_tasks", "Update Mission status"),
        
        # Volunteer reports verification
        ("e_volunteer", "p_history", "Upload proof photo"),
        ("p_history", "ds_tasks", "Complete verification"),
        ("ds_tasks", "p_history", "Fetch completion metrics"),
        ("p_history", "e_victim", "Rescue summary history"),
        ("p_history", "e_admin", "Perform task audit"),

        # Authentication flows
        ("e_victim", "p_auth", "Login Request"),
        ("e_ngo", "p_auth", "Login Request"),
        ("e_volunteer", "p_auth", "Login Request"),
        ("e_admin", "p_auth", "Login Request"),
        ("p_auth", "ds_users", "Retrieve profile info")
    ]

    edge_style = "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;strokeWidth=1;fontSize=10;"
    for idx, (src, tgt, label) in enumerate(flows):
        edge = ET.SubElement(root, 'mxCell', id=f"dfd_edge_{idx}", value=label, style=edge_style, parent="1", source=src, target=tgt, edge="1")
        ET.SubElement(edge, 'mxGeometry', relative="1", as_="geometry")

    ET.ElementTree(mxGraphModel).write("dfd_mx.xml", encoding="utf-8", xml_declaration=False)

if __name__ == "__main__":
    build_usecase_xml()
    build_dfd_xml()
    print("Clean mxGraphModel XML files generated!")
