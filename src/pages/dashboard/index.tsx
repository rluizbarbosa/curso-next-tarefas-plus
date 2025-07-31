import styles from '@/styles/Dashboard.module.css'
import { GetServerSideProps } from 'next'
import Head from 'next/head'
import {getSession} from 'next-auth/react'
import TextArea from '@/components/textarea'
import { FiShare2, FiTrash2 } from 'react-icons/fi'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { db } from '../../services/firebaseConnections'
import { doc, addDoc, deleteDoc, collection, query, orderBy, where, onSnapshot } from 'firebase/firestore'
import Link from 'next/link'

interface DashboardProps{
    user: {
        email: string
    }
}

interface TaksProps{
    id: string
    created: Date
    public: boolean
    tarefa: string
    user: string
}

export default function Dashboard({user} : DashboardProps){
    const [input, setInput] = useState('')
    const [publicTask, setPublicTask] = useState(false)
    const [tasks, setTasks] = useState<TaksProps[]>([])

    useEffect(() => {
        async function loadTarefas(){
            const tarefasRef = collection(db, 'tarefas')
            const q = query(
                tarefasRef,
                orderBy("created", "desc"),
                where("user", "==", user?.email)
            )
            onSnapshot(q, (snapshot) => {
                let lista = [] as TaksProps[];
                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public
                    })
                })
                setTasks(lista)
            })
        }

        loadTarefas()
    }, [user?.email])

    async function handleRegisterTask(e: FormEvent){
        e.preventDefault()

        if(input === '') return;

        try{
            await addDoc(collection(db, "tarefas"), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask
            })

            setInput('')
            setPublicTask(false)
        }catch(e){
            console.log(e)
        }

    }

    async function handleShare(id: string){
        await navigator.clipboard.writeText(
            `${process.env.NEXT_PUBLIC_URL}/task/${id}`
        )
        alert("URL Copiada com sucesso!!!")
    }

    async function handleDeleteTask(id: string){
        const docRef = doc(db, 'tarefas', id)
        await deleteDoc(docRef)
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Meu painel de tarefas</title>
            </Head>
            <main className={styles.main}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual a sua tarefa?</h1>
                        <form onSubmit={handleRegisterTask}>
                            <TextArea
                                placeholder="Digite qual a sua tarefa"
                                value={input}
                                onChange={(e:ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            ></TextArea>
                            <div className={styles.checkboxArea}>
                                <input 
                                    type="checkbox" 
                                    className={styles.checkbox} 
                                    checked={publicTask}
                                    onChange={() => setPublicTask(!publicTask)}
                                />
                                <label>Deixar tarefa publica?</label>
                            </div>
                            <button
                                className={styles.button} 
                                type="submit">
                                Registrar
                            </button>
                        </form>
                    </div>
                </section>
                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>
                    {tasks.map((item) => (
                        <article key={item.id} className={styles.task}>
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PÚBLICO</label>
                                    <button className={styles.shareButton} onClick={() => handleShare(item.id)}>
                                        <FiShare2
                                            size={22}
                                            color='#3183FF'
                                        ></FiShare2>
                                    </button>
                                </div>
                            )}
                            <div className={styles.taskContent}>
                                {item.public ? (
                                    <Link href={`/task/${item.id}`}>
                                        <p>{item.tarefa}</p>
                                    </Link>
                                ) : (
                                    <p>{item.tarefa}</p>
                                )}
                                <button className={styles.trashButton} onClick={() => handleDeleteTask(item.id)}>
                                    <FiTrash2
                                        size={24}
                                        color='#EA3140'
                                    ></FiTrash2>
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </main>
        </div>
    )   
}

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    
    const session  = await getSession({req})

    if(!session?.user){
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        }
    }

    return {
        props: {
            user: {
                email: session?.user?.email
            }
        }
    }
}