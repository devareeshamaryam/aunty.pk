import TopUpForm from '../../TopUpForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditTopUpPage({ params }: Props) {
  const { id } = await params
  return <TopUpForm mode="edit" itemId={id} />
}