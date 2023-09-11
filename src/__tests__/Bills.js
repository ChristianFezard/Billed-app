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

// Mock du store

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
      const handleClickIconEye = jest.fn(billPage.handleClickIconEye)
      // recuperation de la modale
      const modal = document.getElementById("modaleFile")
      // simulation de l'ouverture de la modale
      $.fn.modal = jest.fn(() => modal.classList.add("show"))
      // ajout de l'ecouteur de click, simulation du click et et mise en place de l'attente
      icon.forEach((icon) => {
        icon.addEventListener("click", () => handleClickIconEye(icon))
        userEvent.click(icon)
        expect(handleClickIconEye).toHaveBeenCalled()
        expect(modal.classList.contains("show")).toBe(true)
      })
    })
  })
  
  // test de l'envoi vers la page "envoyer une nouvelle note de frais" via le click du bouton "Nouvelle note de frais"

  describe("When I click on the New Bill button", () => {
    test("Then I am sent to the New Bill page", () => {
      // Création d'une fonction mockant une navigation
      const onNavigateMock = jest.fn()
      // création d'une instance Bills
      const bills = new Bills({
          document,
          onNavigate: onNavigateMock,
          store: null,
          localStorage: null,
      })
      // simulation de la fonction click du button
      bills.handleClickNewBill()
      // Vérification que la fonction onNavigate nous envoie vers la page NewBill
      expect(onNavigateMock).toHaveBeenCalledWith(ROUTES_PATH["NewBill"])
    })
  })  
})

// test de la methode GET pour recuperation de la page Note de frais
// On utilise les données mocks pour le test

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH['Bills'])
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(document.querySelectorAll('tbody tr').length).toBe(4)
      expect(document.querySelectorAll('tbody tr td')[0].textContent).toEqual("Hôtel et logement")
    })
  })

  // test de connexion

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockedStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    // test erreur 404

    test("fetches bills from an API and fails with 404 message error", async () => {

      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH['Bills'])
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    // test erreur 500

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockedStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})

      window.onNavigate(ROUTES_PATH['Bills'])
      await new Promise(process.nextTick)
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})