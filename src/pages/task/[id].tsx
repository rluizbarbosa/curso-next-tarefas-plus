import { ChangeEvent, FormEvent, useState } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import styles from '@/styles/Task.module.css'
import { GetServerSideProps } from 'next'
import { FiTrash2 } from 'react-icons/fi'

import { db } from '../../services/firebaseConnections'
import { doc, collection, query, where, getDoc, addDoc, getDocs, orderBy, deleteDoc } from 'firebase/firestore'
import TextArea from '@/components/textarea'

interface TaskProps{
    item: {
        tarefa: string
        public: boolean
        created: string
        user: string
        taskId: string
    }
    allComments : CommentsProps[]
}

interface CommentsProps{
    id: string
    comment: string
    taskId: string
    user: string
    name: string
}

export default function Task({ item, allComments} : TaskProps){

    const {data: session} = useSession()
    const [input, setInput] = useState("")
    const [comments, setComments] = useState<CommentsProps[]>(allComments || [])

    async function handleComment(e: FormEvent){
        e.preventDefault()
        if(input === "") return
        if(!session?.user?.email || !session?.user?.name) return

        try {
            const docRef = await addDoc(collection(db, "comments"),{
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId
            })
            const data = {
                id: docRef.id,
                comment: input,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: item?.taskId
            }

            setComments([data, ...comments])
            setInput('')

        } catch (error) {
            console.log(error)
        }
    }

    async function handleDeleteComment(id: string){
        try{
            const docRef = doc(db, "comments", id)
            await deleteDoc(docRef)
            const deleteComment = comments.filter((item) => item.id !== id)
            
            setComments(deleteComment)

        }catch(error){
            console.log(error)
        }
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Detalhes da Tarefa</title>
            </Head>
            <main className={styles.main}>
                <h1>Tarefa</h1>
                <article className={styles.task}>
                    <p>{item.tarefa}</p>
                </article>
            </main>

            <section className={styles.commentsContainer}>
                <h2>Deixar comentário</h2>
                <form onSubmit={handleComment}>
                    <TextArea
                        placeholder="Digite seu comentário..."
                        value={input}
                        onChange={(e:ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                    ></TextArea>
                    <button 
                        type='submit'
                        disabled={!session?.user}
                        className={styles.button}
                    >Enviar comentário</button>
                </form>
            </section>
            <section className={styles.commentsContainer}>
                <h2>Todos os comentarios</h2>
                {comments.length === 0 && (
                    <span>Nenhum comentário foi encontrado...</span>
                )}

                {comments.map((item) => (
                    <article key={item.id} className={styles.comment}>
                        <div className={styles.headComment}>
                            <label className={styles.commentsLabel}>{item.name}</label>
                            {item.user === session?.user?.email && (
                                <button 
                                    className={styles.trashButton} 
                                    onClick={() => handleDeleteComment(item.id)}>
                                    <FiTrash2
                                        size={24}
                                        color='#EA3140'
                                    ></FiTrash2>
                                </button>
                            )}
                        </div>
                        <p>{item.comment}</p>
                    </article>
                ))}
            </section>
        </div>
    )
}

export const getServerSideProps : GetServerSideProps = async ({ params }) => {

    const id = params?.id as string

    const docRef = doc(db, 'tarefas', id)

    const q = query(
        collection(db, "comments"), 
        orderBy("created", "desc"), 
        where("taskId", "==", id)
    )
    const snapshotCommets = await getDocs(q)

    let allComments: CommentsProps[] = []

    snapshotCommets.forEach((doc) => {
        allComments.push({
            id: doc.id,
            comment: doc.data()?.comment,
            taskId: doc.data()?.taskId,
            user: doc.data()?.user,
            name: doc.data()?.name
        })
    })

    const snapshot = await getDoc(docRef)

    const redirectHome = {
            redirect : {
                destination: '/',
                permanent: false
            }
        }

    if(snapshot.data === undefined || !snapshot.data()?.public){
        return redirectHome
    }

    const miliseconds = snapshot.data()?.created.seconds * 1000

    const task = {
        tarefa: snapshot.data()?.tarefa,
        public: snapshot.data()?.public,
        created: new Date(miliseconds).toLocaleDateString(),
        user: snapshot.data()?.user,
        taskId: id
    }

    return {
        props: {
            item: task,
            allComments: allComments
        }
    }
}