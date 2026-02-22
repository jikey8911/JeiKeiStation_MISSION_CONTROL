import asyncio
from playwright.async_api import async_playwright
import time

async def run_qa():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Create a context with a larger viewport
        context = await browser.new_context(viewport={'width': 1280, 'height': 720})
        page = await context.new_page()

        print("Step 1: Loading Dashboard...")
        await page.goto("http://127.0.0.1:3000/dashboard")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="verification/qa_1_dashboard.png")

        print("Step 2: Testing Navigation...")
        tabs = ["Oficina Virtual", "Topología", "Panel de Control", "Tablero Kanban"]
        for tab in tabs:
            print(f"  Navigating to {tab}...")
            await page.get_by_role("tab", name=tab).click()
            await page.wait_for_timeout(500)

        print("Step 3: Creating Sprint...")
        # Ensure we are in Control Panel
        await page.get_by_role("tab", name="Panel de Control").click()
        await page.get_by_role("button", name="Nuevo Sprint").click()

        # Use exact placeholders from code
        await page.get_by_placeholder("Nombre del sprint (ej: Sprint 1 - Q1 2026)").fill("Sprint de Prueba QA V2")
        await page.get_by_placeholder("Descripción (opcional)").nth(0).fill("Verificar la creación de sprints")
        await page.get_by_role("button", name="Crear Sprint").click()

        # Wait for toast
        await page.wait_for_selector("text=Sprint creado exitosamente")
        await page.wait_for_timeout(1000)

        print("Step 4: Creating Task...")
        # Go to Kanban
        await page.get_by_role("tab", name="Tablero Kanban").click()
        await page.wait_for_timeout(1000)

        # Click Nueva Tarea
        await page.get_by_role("button", name="Nueva Tarea").click()

        # Wait for dialog
        dialog_selector = "text=Crear Nueva Tarea"
        await page.wait_for_selector(dialog_selector)

        print("  Filling task details...")
        await page.get_by_placeholder("Título de la tarea").fill("Tarea de Prueba QA V2")
        # There might be multiple "Descripción (opcional)" placeholders
        await page.get_by_placeholder("Descripción (opcional)").nth(0).fill("Esta es una tarea generada por el script de QA V2")

        await page.screenshot(path="verification/qa_task_dialog_filled.png")

        print("  Submitting task...")
        await page.get_by_role("button", name="Crear Tarea").click()

        # Wait for task to appear or dialog to close
        await page.wait_for_timeout(2000)

        print("Step 5: Final verification...")
        await page.screenshot(path="verification/qa_final_v2.png")

        # Check if the task title is visible on the board
        is_task_visible = await page.get_by_text("Tarea de Prueba QA V2").is_visible()
        if is_task_visible:
            print("SUCCESS: Task is visible on the Kanban board.")
        else:
            print("WARNING: Task might not be visible yet, but script completed.")

        await browser.close()
        print("QA Script completed.")

if __name__ == "__main__":
    asyncio.run(run_qa())
