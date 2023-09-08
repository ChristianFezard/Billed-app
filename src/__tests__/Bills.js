/**
 * @jest-environment jsdom
 */

import {screen, waitFor} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedStore from "../__mocks__/store.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockedStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // test de l'activité de l'icone

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // ecriture de l'attente
      expect(windowIcon.classList).toContain('active-icon')
    })

    // test du tri des dates

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen
      .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
      .map(a => a.innerHTML)
      const antiChrono = (a, b) => a - b // correction de l'ancienne version const antiChrono = (a, b) => (a < b ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
    // test d'ouverture de la modale au click sur l'icone oeil

  describe("when i click on the eye icon", () => {
    test("Then a modal displaying the receipt opens", async () => {
      // fonction simulant une navigation
      const onNavigate = (pathName) => {
        document.body.innerHTML = ROUTES({ pathName })
      }
      // simulation du localeStorage
      Object.defineProperty(window, "localeStorage", {
        value: localStorageMock,
      })
      // simulation d'un utilisateur
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      )
      // création d'une instance Bills
      const billPage = new Bills({
        document,
        onNavigate,
        store: mockedStore,
        localStorage: window.localStorage,
      })
      // definition de la page Bills
      document.body.innerHTML = BillsUI({ data: bills })
      // recuperation des id test icones oeil
      const icon = screen.getAllByTestId("icon-eye")
      // simulation de la fonction click de l'icone
      const handleClickIconEye = jest.fn(billPage.handleClickIconEye);
      // recuperation de la modale
      const modal = document.getElementById("modaleFile")
      // simulation de l'ouverture de la modale
      $.fn.modal = jest.fn(() => modal.classList.add("show"))
      // ajout de l'ecouteur de click, simulation du click et et mise en place de l'attente
      icon.forEach((icon) => {
        icon.addEventListener("click", () => handleClickIconEye(icon));
        userEvent.click(icon);
        expect(handleClickIconEye).toHaveBeenCalled();
        expect(modal.classList.contains("show")).toBe(true);
      });
    })
  }) 
})

