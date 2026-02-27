import { useEffect, useState } from 'react';
import { useUser } from '../../common/components/UserContext';
import { getNotifications, deleteInvitation, AcceptInvitation, getbids, deleteBid,deleteBidSystem,acceptBid,getbidsAccepted } from '../../../backend/leagueService';
import Errors  from './Errors';

function NotificationComponent({mockData1, mockData2, mockdata3}) {
  const { userLoguedId } = useUser();
  const [listaNotificaciones, setListaNotificaciones] = useState([]);
  const [backendErrors, setBackendErrors] = useState(null);

  const handleAcceptBid = (leagueId,idBid,index) => {
    acceptBid(idBid);
    const element = document.getElementById(index);
    if (element) {
      element.remove();
    }
    window.location.reload();
  }

  const handleRejectBid = (leagueId, idBid,index) => {
    deleteBidSystem(leagueId,idBid);
    const element = document.getElementById(index);
    if (element) {
      element.remove();
    }
    window.location.reload();
  }
  
  const handleCancelInvitation = (leagueId, index) => {
    deleteInvitation(leagueId);
    const element = document.getElementById(index);
    if (element) {
      element.remove();
    }
    window.location.reload();
  }

  const handleAcceptInvitation = (leagueID, index) => {
    AcceptInvitation(
        leagueID,
        () => {
            setBackendErrors(null);
            const element = document.getElementById(index);
            if (element) {
                element.remove();
            }
            window.location.reload();
        },
        (backendErrors) => {
          setBackendErrors(backendErrors);
        },
    );
  };

  useEffect(() => {
    
    setListaNotificaciones([]);

    const makeNotificationBid = (lista) => {
      const n = lista.map((element) => ({
        senderId: (element.senderId==null) ? "waterfantasy" : element.senderId,
        leagueId: element.leagueId,
        id: element.id,
        type: element.type,
        message: `Oferta de ${element.senderName} de ${element.bid} por ${element.player}`,
      }));
      
      setListaNotificaciones((prev) => [...prev, ...n]);
    }

    const makeNotificationBidAccepted = (lista) => {
      const n = lista.map((element) => ({
        senderId: element.senderId,
        leagueId: element.leagueId,
        id: element.id,
        type: "bid_accepted",
        message: `El usuario ${element.senderName} acepto tu oferta de ${element.bid} por ${element.player}`,
      }));
      setListaNotificaciones((prev) => [...prev, ...n]);
    }    
    
    const makeNotificationFromBd = (lista) => {
      const n = lista.map((element) => ({
        senderId: element.senderId,
        leagueId: element.leagueId,
        type: "invitation",
        message: `Invitado a la liga: ${element.leagueName} por ${element.senderName}`,
      }));
      setListaNotificaciones((prev) => [...prev, ...n]);
    };

    const makeNotification = (receivedMessage) => {
      let n = {
        senderId: receivedMessage.senderId,
        leagueId: receivedMessage.leagueId,
        type: "invitation",
        message: receivedMessage.message
      }
      setListaNotificaciones((prev) => [...prev, n]);
    };

    if(mockData1){
        makeNotificationFromBd(mockData1)
      
    } 
    if(mockData2){
      makeNotificationBid(mockData2);
    }
    if(mockdata3){
      makeNotificationBidAccepted(mockdata3);
    }
    else {
      getNotifications((data) => {
        makeNotificationFromBd(data);
      });

      getbids((data) => {
        makeNotificationBid(data);
      });

      getbidsAccepted((data) => {
        makeNotificationBidAccepted(data);
      });
    
    }
    
    const ws = new WebSocket("ws://localhost:8080/waterfantasy/ws");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
            type: "register",
            payload: { userId: `user-${userLoguedId}` },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        
        const receivedMessage = JSON.parse(event.data);
        if(receivedMessage.type === "bid"){
          
          makeNotificationBid([receivedMessage]);
        }
        else if(receivedMessage.type === "bid_accepted"){
        
          makeNotificationBidAccepted([receivedMessage]);
        }
        else{
          makeNotification(receivedMessage);
        }
      
      } catch (error) {
        console.error("Error al procesar el mensaje:", error);
      }
    };


    ws.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    ws.onclose = () => {
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <button type="button" className="btn btn-warning position-relative"
        data-bs-toggle="modal" data-bs-target="#notificaciones">
        Notificaciones
        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          {listaNotificaciones.length}
        </span>
      </button>

      <div className="modal fade" id="notificaciones" tabIndex="-1" aria-labelledby="notificaciones" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg" >
          <div className="modal-content">
            <div className="modal-header bazul3">
              <h5 className="modal-title blanco" id="exampleModalLongTitle">Invitaciones</h5>
              <button type="button" className="btn-close bblanco" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <Errors errors={backendErrors} onClose={() => setBackendErrors(null)} />
            <div className="modal-body">
              {listaNotificaciones.map((notif, index) => (
                <div className='row align-items-center border-bottom mx-2 mb-2' key={index} id={index}>
                  <div className=' col card shadow'>
                    <div className='row'>
                      <div className='col text-center'>
                        <>
                          <p className='mt-4' >{notif.message}</p>
                        </>
                      </div>
                      <div className='col-4 text-center mt-3'>
                        {notif.type == "bid" ?  (
                          <div className="btn-group">
                          <button type="button" className="btn btn-success" onClick={() => handleAcceptBid( notif.leagueId, notif.id,index)}>Aceptar</button>
                          <button type="button" className="btn btn-danger" onClick={() => handleRejectBid(notif.leagueId, notif.id,index)}>Rechazar</button>
                        </div>
                        ) : notif.type == "bid_accepted"? (
                          <div>
                            <button type="button" className="btn btn-success" onClick={() => handleRejectBid(notif.leagueId, notif.id,index)} >OK</button>
                          </div>
                        ) : (
                          <div className="btn-group">
                          <button type="button" className="btn btn-success" onClick={() => handleAcceptInvitation(notif.leagueId, index)}>Aceptar</button>
                          <button type="button" className="btn btn-danger" onClick={() => handleCancelInvitation(notif.leagueId, index)}>Rechazar</button>
                        </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className='modal-footer bazul3'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationComponent;
