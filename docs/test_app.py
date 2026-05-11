from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='C:/Users/Useradmin/Documents/Saas/docs/test_dashboard.png', full_page=True)

    page.click('text=Punto de Venta')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='C:/Users/Useradmin/Documents/Saas/docs/test_pos.png', full_page=True)

    page.click('text=Inventario')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='C:/Users/Useradmin/Documents/Saas/docs/test_inventory.png', full_page=True)

    page.click('text=Contabilidad')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='C:/Users/Useradmin/Documents/Saas/docs/test_accounting.png', full_page=True)

    page.click('text=Nómina')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='C:/Users/Useradmin/Documents/Saas/docs/test_hr.png', full_page=True)

    print("All pages loaded successfully!")
    browser.close()
